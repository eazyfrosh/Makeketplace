import { NextResponse } from "next/server";
import {
  AirlineBookingOwnershipError,
  AirlineBookingStoreUnavailableError,
  findOwnedBookingByReference,
} from "@/lib/airline/server-bookings";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const reference = typeof body?.reference === "string" ? body.reference : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName : "";
  if (!/^[A-Za-z0-9-]{4,32}$/.test(reference.trim()) || !lastName.trim() || lastName.length > 100) {
    return NextResponse.json({ error: "Enter a valid booking reference and last name." }, { status: 400 });
  }
  try {
    return NextResponse.json({ booking: await findOwnedBookingByReference(reference, lastName, caller.uid) });
  } catch (error) {
    if (error instanceof AirlineBookingOwnershipError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof AirlineBookingStoreUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[airline/bookings/lookup]", error);
    return NextResponse.json({ error: "Booking lookup could not be completed." }, { status: 500 });
  }
}
