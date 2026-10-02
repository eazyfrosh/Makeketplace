import { NextResponse } from "next/server";
import {
  AirlineBookingOwnershipError,
  AirlineBookingStoreUnavailableError,
  findOwnedBookingStatusByReference,
} from "@/lib/airline/server-bookings";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const reference = typeof body?.reference === "string" ? body.reference.trim().toUpperCase() : "";
  if (!/^[A-Z0-9-]{4,32}$/.test(reference)) {
    return NextResponse.json({ error: "Enter a valid booking number." }, { status: 400 });
  }
  try {
    return NextResponse.json({ booking: await findOwnedBookingStatusByReference(reference, caller.uid) });
  } catch (error) {
    if (error instanceof AirlineBookingOwnershipError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof AirlineBookingStoreUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[airline/bookings/status]", error);
    return NextResponse.json({ error: "Flight status could not be loaded." }, { status: 500 });
  }
}
