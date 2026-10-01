import { NextResponse } from "next/server";
import { isBooking } from "@/lib/airline/booking-record";
import {
  AirlineBookingConflictError,
  AirlineBookingOwnershipError,
  AirlineBookingStoreUnavailableError,
  listBookingsForUser,
  saveOwnedBooking,
} from "@/lib/airline/server-bookings";
import { verifyCaller } from "@/lib/licensing/verify-auth";

function bookingError(error: unknown) {
  if (error instanceof AirlineBookingOwnershipError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof AirlineBookingConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof AirlineBookingStoreUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
  console.error("[airline/bookings]", error);
  return NextResponse.json({ error: "Trips could not be loaded. Please try again." }, { status: 500 });
}

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ bookings: await listBookingsForUser(caller.uid) });
  } catch (error) {
    return bookingError(error);
  }
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? "0") > 250_000) {
    return NextResponse.json({ error: "Booking record is too large." }, { status: 413 });
  }
  const body = await request.json().catch(() => null);
  if (!isBooking(body?.booking)) return NextResponse.json({ error: "Invalid booking record." }, { status: 400 });
  if (body.booking.userId !== caller.uid) return NextResponse.json({ error: "Booking access denied." }, { status: 403 });
  try {
    const booking = await saveOwnedBooking(body.booking, caller.uid, { migrationOnly: body.mode === "migration" });
    return NextResponse.json({ booking }, { status: 200 });
  } catch (error) {
    return bookingError(error);
  }
}
