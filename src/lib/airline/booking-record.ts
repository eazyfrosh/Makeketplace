import type { Booking, BookingStatus } from "@/lib/airline/types";

const BOOKING_STATUSES = new Set<BookingStatus>([
  "confirmed",
  "checked_in",
  "boarding",
  "departed",
  "completed",
  "cancelled",
]);

export function normalizeBookingReference(value: string) {
  return value.trim().toUpperCase();
}

export function isBooking(value: unknown): value is Booking {
  if (!value || typeof value !== "object") return false;
  const booking = value as Partial<Booking>;
  return Boolean(
    typeof booking.id === "string" &&
      /^[A-Za-z0-9_-]{4,128}$/.test(booking.id) &&
      typeof booking.userId === "string" &&
      booking.userId.length > 0 &&
      typeof booking.bookingReference === "string" &&
      /^[A-Z0-9-]{4,32}$/.test(normalizeBookingReference(booking.bookingReference)) &&
      typeof booking.verificationToken === "string" &&
      /^[A-Za-z0-9_-]{16,256}$/.test(booking.verificationToken) &&
      Array.isArray(booking.flights) &&
      booking.flights.length > 0 &&
      Array.isArray(booking.passengers) &&
      booking.passengers.length > 0 &&
      typeof booking.status === "string" &&
      BOOKING_STATUSES.has(booking.status as BookingStatus) &&
      typeof booking.createdAt === "string" &&
      Number.isFinite(booking.totalPrice) &&
      Number.isFinite(booking.ticketPrice) &&
      typeof booking.currency === "string"
  );
}

export function publicVerificationBooking(input: Booking): Booking {
  return {
    ...input,
    bookingReference: normalizeBookingReference(input.bookingReference),
    passengers: input.passengers.map((passenger) => ({
      ...passenger,
      passportNumber: "",
      email: "",
      phone: "",
      dateOfBirth: "",
    })),
  };
}
