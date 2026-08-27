import { getAll, getOne, queryByField, remove, upsert } from "@/lib/airline/services/store";
import { generateVerificationToken } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";

const COLLECTION = "bookings";
const LOOKUP_COLLECTION = "bookingLookup";
const VERIFICATION_COLLECTION = "bookingVerification";

function lookupId(booking: Booking) {
  return booking.bookingReference.trim().toUpperCase();
}

function verificationId(booking: Booking) {
  return `${lookupId(booking)}_${booking.verificationToken}`;
}

/**
 * Mirrors so the unauthenticated lookup flows (manage-booking by reference +
 * last name, and QR verification by reference + token) can fetch a single
 * booking by its exact key without needing to scan every booking.
 */
async function syncPublicMirrors(booking: Booking): Promise<void> {
  await Promise.all([
    upsert(LOOKUP_COLLECTION, { ...booking, id: lookupId(booking) }),
    upsert(VERIFICATION_COLLECTION, { ...booking, id: verificationId(booking) }),
  ]);
}

async function saveBooking(booking: Booking): Promise<void> {
  await upsert(COLLECTION, booking);
  await syncPublicMirrors(booking);
}

export function createBooking(booking: Booking) {
  return saveBooking(booking);
}

async function withVerificationToken(booking: Booking): Promise<Booking> {
  if (booking.verificationToken) return booking;
  const patched: Booking = { ...booking, verificationToken: generateVerificationToken() };
  await saveBooking(patched);
  return patched;
}

export async function getBooking(id: string): Promise<Booking | null> {
  const booking = await getOne<Booking>(COLLECTION, id);
  return booking ? withVerificationToken(booking) : null;
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const items = await queryByField<Booking>(COLLECTION, "userId", userId);
  return Promise.all(items.map(withVerificationToken));
}

export async function getAllBookings(): Promise<Booking[]> {
  const items = await getAll<Booking>(COLLECTION);
  return Promise.all(items.map(withVerificationToken));
}

export function updateBooking(booking: Booking) {
  return saveBooking(booking);
}

export async function deleteBooking(id: string): Promise<void> {
  const booking = await getOne<Booking>(COLLECTION, id);
  await remove(COLLECTION, id);
  if (booking) {
    await Promise.all([
      remove(LOOKUP_COLLECTION, lookupId(booking)),
      remove(VERIFICATION_COLLECTION, verificationId(booking)),
    ]);
  }
}

export function cancelBooking(booking: Booking) {
  return saveBooking({ ...booking, status: "cancelled" as const });
}

export async function findBookingByReferenceAndName(
  reference: string,
  lastName: string
): Promise<Booking | null> {
  const ref = reference.trim().toUpperCase();
  const name = lastName.trim().toLowerCase();
  if (!ref || !name) return null;
  const booking = await getOne<Booking>(LOOKUP_COLLECTION, ref);
  if (!booking) return null;
  return booking.passengers.some((p) => p.lastName.trim().toLowerCase() === name) ? booking : null;
}

export async function getBookingByReferenceAndToken(reference: string, token: string): Promise<Booking | null> {
  const ref = reference.trim().toUpperCase();
  const tok = token.trim();
  if (!ref || !tok) return null;
  return getOne<Booking>(VERIFICATION_COLLECTION, `${ref}_${tok}`);
}
