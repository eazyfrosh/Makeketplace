"use client";

import { getAll, getOne, remove, upsert } from "@/lib/airline/services/store";
import { generateVerificationToken } from "@/lib/airline/utils";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { Booking, BookingStatusSummary } from "@/lib/airline/types";

const COLLECTION = "bookings";
const LOOKUP_COLLECTION = "bookingLookup";
const VERIFICATION_COLLECTION = "bookingVerification";

class BookingApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function lookupId(booking: Booking) {
  return booking.bookingReference.trim().toUpperCase();
}

function verificationId(booking: Booking) {
  return `${lookupId(booking)}_${booking.verificationToken}`;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...headers, ...init.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BookingApiError(result.error ?? "The booking request could not be completed.", response.status);
  }
  return result as T;
}

async function cacheBooking(booking: Booking): Promise<void> {
  await Promise.all([
    upsert(COLLECTION, booking),
    upsert(LOOKUP_COLLECTION, { ...booking, id: lookupId(booking) }),
    upsert(VERIFICATION_COLLECTION, { ...booking, id: verificationId(booking) }),
  ]);
}

async function ensureVerificationToken(booking: Booking): Promise<Booking> {
  if (booking.verificationToken) return booking;
  return { ...booking, verificationToken: generateVerificationToken() };
}

async function saveBooking(booking: Booking, existing: boolean): Promise<Booking> {
  const prepared = await ensureVerificationToken(booking);
  try {
    const result = await api<{ booking: Booking }>(
      existing ? `/api/airline/bookings/${encodeURIComponent(prepared.id)}` : "/api/airline/bookings",
      { method: existing ? "PUT" : "POST", body: JSON.stringify({ booking: prepared }) },
    );
    await cacheBooking(result.booking);
    return result.booking;
  } catch (error) {
    if (error instanceof BookingApiError && error.status === 503) {
      const cached = { ...prepared, updatedAt: new Date().toISOString() };
      await cacheBooking(cached);
      return cached;
    }
    throw error;
  }
}

async function migrateLocalBookings(userId: string): Promise<boolean> {
  const local = (await getAll<Booking>(COLLECTION)).filter((booking) => booking.userId === userId);
  if (local.length === 0) return true;
  try {
    await Promise.all(
      local.map(async (booking) => {
        const prepared = await ensureVerificationToken(booking);
        const result = await api<{ booking: Booking }>("/api/airline/bookings", {
          method: "POST",
          body: JSON.stringify({ booking: prepared, mode: "migration" }),
        });
        await cacheBooking(result.booking);
      }),
    );
    return true;
  } catch (error) {
    if (error instanceof BookingApiError && error.status === 503) return false;
    throw error;
  }
}

export async function createBooking(booking: Booking): Promise<void> {
  await saveBooking(booking, false);
}

export async function getBooking(id: string): Promise<Booking | null> {
  try {
    const result = await api<{ booking: Booking }>(`/api/airline/bookings/${encodeURIComponent(id)}`);
    await cacheBooking(result.booking);
    return result.booking;
  } catch (error) {
    const cached = await getOne<Booking>(COLLECTION, id);
    if (error instanceof BookingApiError && error.status === 404 && cached) {
      try {
        const migrated = await api<{ booking: Booking }>("/api/airline/bookings", {
          method: "POST",
          body: JSON.stringify({ booking: await ensureVerificationToken(cached), mode: "migration" }),
        });
        await cacheBooking(migrated.booking);
        return migrated.booking;
      } catch (migrationError) {
        if (migrationError instanceof BookingApiError && migrationError.status === 503) return cached;
        throw migrationError;
      }
    }
    if (error instanceof BookingApiError && error.status === 503) return cached;
    if (error instanceof BookingApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const migrated = await migrateLocalBookings(userId);
  if (!migrated) {
    return (await getAll<Booking>(COLLECTION)).filter((booking) => booking.userId === userId);
  }
  const result = await api<{ bookings: Booking[] }>("/api/airline/bookings");
  await Promise.all(result.bookings.map(cacheBooking));
  return result.bookings;
}

export async function getAllBookings(): Promise<Booking[]> {
  return getAll<Booking>(COLLECTION);
}

export async function updateBooking(booking: Booking): Promise<void> {
  await saveBooking(booking, true);
}

export async function deleteBooking(id: string): Promise<void> {
  const booking = await getOne<Booking>(COLLECTION, id);
  try {
    await api(`/api/airline/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    if (!(error instanceof BookingApiError && (error.status === 404 || error.status === 503))) throw error;
  }
  await remove(COLLECTION, id);
  if (booking) {
    await Promise.all([
      remove(LOOKUP_COLLECTION, lookupId(booking)),
      remove(VERIFICATION_COLLECTION, verificationId(booking)),
    ]);
  }
}

export async function cancelBooking(booking: Booking): Promise<void> {
  await updateBooking({ ...booking, status: "cancelled" as const });
}

export async function findBookingByReferenceAndName(
  reference: string,
  lastName: string,
): Promise<Booking | null> {
  const ref = reference.trim().toUpperCase();
  const name = lastName.trim().toLowerCase();
  if (!ref || !name) return null;
  try {
    const result = await api<{ booking: Booking | null }>("/api/airline/bookings/lookup", {
      method: "POST",
      body: JSON.stringify({ reference: ref, lastName }),
    });
    if (result.booking) await cacheBooking(result.booking);
    return result.booking;
  } catch (error) {
    if (!(error instanceof BookingApiError && error.status === 503)) throw error;
    const cached = await getOne<Booking>(LOOKUP_COLLECTION, ref);
    return cached?.passengers.some((passenger) => passenger.lastName.trim().toLowerCase() === name)
      ? cached
      : null;
  }
}

export async function findBookingStatusByReference(reference: string): Promise<BookingStatusSummary | null> {
  const ref = reference.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(ref)) return null;
  try {
    const result = await api<{ booking: BookingStatusSummary | null }>("/api/airline/bookings/status", {
      method: "POST",
      body: JSON.stringify({ reference: ref }),
    });
    return result.booking;
  } catch (error) {
    if (!(error instanceof BookingApiError && error.status === 503)) throw error;
    const cached = (await getAll<Booking>(COLLECTION)).find(
      (booking) => booking.bookingReference.trim().toUpperCase() === ref,
    );
    if (!cached) return null;
    return {
      bookingReference: ref,
      status: cached.status,
      flights: cached.flights,
      gate: cached.gate,
      terminal: cached.terminal,
      boardingTime: cached.boardingTime,
    };
  }
}

export async function getBookingByReferenceAndToken(reference: string, token: string): Promise<Booking | null> {
  const ref = reference.trim().toUpperCase();
  const tok = token.trim();
  if (!ref || !tok) return null;
  return getOne<Booking>(VERIFICATION_COLLECTION, `${ref}_${tok}`);
}
