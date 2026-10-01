import { NextResponse } from "next/server";
import { isBooking } from "@/lib/airline/booking-record";
import {
  AirlineBookingConflictError,
  AirlineBookingOwnershipError,
  AirlineBookingStoreUnavailableError,
  deleteOwnedBooking,
  getOwnedBooking,
  saveOwnedBooking,
} from "@/lib/airline/server-bookings";
import { verifyCaller } from "@/lib/licensing/verify-auth";

type Context = { params: Promise<{ id: string }> };

function responseForError(error: unknown) {
  if (error instanceof AirlineBookingOwnershipError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof AirlineBookingConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof AirlineBookingStoreUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
  console.error("[airline/bookings/id]", error);
  return NextResponse.json({ error: "The booking request could not be completed." }, { status: 500 });
}

export async function GET(request: Request, { params }: Context) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  try {
    const booking = await getOwnedBooking(id, caller.uid);
    return booking
      ? NextResponse.json({ booking })
      : NextResponse.json({ error: "Booking not found." }, { status: 404 });
  } catch (error) {
    return responseForError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!isBooking(body?.booking) || body.booking.id !== id) {
    return NextResponse.json({ error: "Invalid booking record." }, { status: 400 });
  }
  if (body.booking.userId !== caller.uid) return NextResponse.json({ error: "Booking access denied." }, { status: 403 });
  try {
    const existing = await getOwnedBooking(id, caller.uid);
    if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    return NextResponse.json({ booking: await saveOwnedBooking(body.booking, caller.uid) });
  } catch (error) {
    return responseForError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  try {
    await deleteOwnedBooking(id, caller.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return responseForError(error);
  }
}
