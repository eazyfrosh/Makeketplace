import "server-only";

import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import {
  normalizeBookingReference,
  publicVerificationBooking,
} from "@/lib/airline/booking-record";
import type { Booking, BookingStatusSummary } from "@/lib/airline/types";

const BOOKINGS = "airlineBookings";
const REFERENCES = "airlineBookingReferences";
const VERIFICATIONS = "airlineBookingVerifications";

export class AirlineBookingStoreUnavailableError extends Error {}
export class AirlineBookingOwnershipError extends Error {}
export class AirlineBookingConflictError extends Error {}

function dbOrThrow() {
  if (!isAdminDbConfigured || !adminDb) {
    throw new AirlineBookingStoreUnavailableError("Trip storage is temporarily unavailable.");
  }
  return adminDb;
}

function verificationId(booking: Booking) {
  return `${normalizeBookingReference(booking.bookingReference)}_${booking.verificationToken}`;
}

function bookingFromData(data: FirebaseFirestore.DocumentData | undefined): Booking | null {
  if (!data) return null;
  const value = data.booking ?? data;
  return value as Booking;
}

export async function listBookingsForUser(userId: string): Promise<Booking[]> {
  const snapshot = await dbOrThrow().collection(BOOKINGS).where("userId", "==", userId).get();
  return snapshot.docs
    .map((doc) => bookingFromData(doc.data()))
    .filter((booking): booking is Booking => Boolean(booking))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getOwnedBooking(id: string, userId: string): Promise<Booking | null> {
  const snapshot = await dbOrThrow().collection(BOOKINGS).doc(id).get();
  const booking = bookingFromData(snapshot.data());
  if (!booking) return null;
  if (booking.userId !== userId) throw new AirlineBookingOwnershipError("Booking access denied.");
  return booking;
}

export async function findOwnedBookingByReference(
  reference: string,
  lastName: string,
  userId: string,
): Promise<Booking | null> {
  const db = dbOrThrow();
  const ref = normalizeBookingReference(reference);
  const pointer = await db.collection(REFERENCES).doc(ref).get();
  if (!pointer.exists || pointer.data()?.userId !== userId) return null;
  const booking = await getOwnedBooking(String(pointer.data()?.bookingId ?? ""), userId);
  if (!booking) return null;
  const wantedName = lastName.trim().toLowerCase();
  return booking.passengers.some((passenger) => passenger.lastName.trim().toLowerCase() === wantedName)
    ? booking
    : null;
}

export async function findOwnedBookingStatusByReference(
  reference: string,
  userId: string,
): Promise<BookingStatusSummary | null> {
  const db = dbOrThrow();
  const ref = normalizeBookingReference(reference);
  const pointer = await db.collection(REFERENCES).doc(ref).get();
  if (!pointer.exists || pointer.data()?.userId !== userId) return null;
  const booking = await getOwnedBooking(String(pointer.data()?.bookingId ?? ""), userId);
  if (!booking) return null;
  return {
    bookingReference: normalizeBookingReference(booking.bookingReference),
    status: booking.status,
    flights: booking.flights,
    gate: booking.gate,
    terminal: booking.terminal,
    boardingTime: booking.boardingTime,
  };
}

export async function saveOwnedBooking(
  booking: Booking,
  userId: string,
  options: { migrationOnly?: boolean } = {},
): Promise<Booking> {
  const db = dbOrThrow();
  const bookingRef = db.collection(BOOKINGS).doc(booking.id);
  const normalizedReference = normalizeBookingReference(booking.bookingReference);
  const referenceRef = db.collection(REFERENCES).doc(normalizedReference);
  const verificationRef = db.collection(VERIFICATIONS).doc(verificationId(booking));
  const now = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    const [existingSnapshot, referenceSnapshot] = await Promise.all([
      transaction.get(bookingRef),
      transaction.get(referenceRef),
    ]);
    const existing = bookingFromData(existingSnapshot.data());
    if (existing && existing.userId !== userId) {
      throw new AirlineBookingOwnershipError("Booking access denied.");
    }
    if (referenceSnapshot.exists) {
      const pointer = referenceSnapshot.data();
      if (pointer?.userId !== userId || pointer?.bookingId !== booking.id) {
        throw new AirlineBookingConflictError("That booking reference is already in use.");
      }
    }
    if (options.migrationOnly && existing) return existing;

    const saved: Booking = {
      ...booking,
      userId,
      bookingReference: normalizedReference,
      updatedAt: now,
    };
    transaction.set(bookingRef, {
      ...saved,
      ownerId: userId,
      schemaVersion: 2,
    });
    transaction.set(referenceRef, {
      bookingId: saved.id,
      userId,
      updatedAt: now,
    });
    transaction.set(verificationRef, {
      ownerId: userId,
      booking: publicVerificationBooking(saved),
      updatedAt: now,
    });
    return saved;
  });
}

export async function deleteOwnedBooking(id: string, userId: string): Promise<void> {
  const db = dbOrThrow();
  const bookingRef = db.collection(BOOKINGS).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    const booking = bookingFromData(snapshot.data());
    if (!booking) return;
    if (booking.userId !== userId) throw new AirlineBookingOwnershipError("Booking access denied.");
    transaction.delete(bookingRef);
    transaction.delete(db.collection(REFERENCES).doc(normalizeBookingReference(booking.bookingReference)));
    transaction.delete(db.collection(VERIFICATIONS).doc(verificationId(booking)));
  });
}
