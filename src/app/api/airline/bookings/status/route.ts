import { NextResponse } from "next/server";
import {
  AirlineBookingOwnershipError,
  AirlineBookingStoreUnavailableError,
  findOwnedBookingStatusByReference,
  findPublicBookingStatusByReference,
} from "@/lib/airline/server-bookings";
import { verifyCaller } from "@/lib/licensing/verify-auth";

const publicHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

function validReference(value: string) {
  const reference = value.trim().toUpperCase();
  return /^[A-Z0-9-]{4,32}$/.test(reference) ? reference : null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: publicHeaders });
}

export async function GET(request: Request) {
  const reference = validReference(new URL(request.url).searchParams.get("reference") ?? "");
  if (!reference) {
    return NextResponse.json({ error: "Enter a valid booking number." }, { status: 400, headers: publicHeaders });
  }
  try {
    const booking = await findPublicBookingStatusByReference(reference);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404, headers: publicHeaders });
    }
    return NextResponse.json({ booking }, { headers: publicHeaders });
  } catch (error) {
    if (error instanceof AirlineBookingStoreUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503, headers: publicHeaders });
    }
    console.error("[airline/bookings/status:get]", error);
    return NextResponse.json({ error: "Flight status could not be loaded." }, { status: 500, headers: publicHeaders });
  }
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const reference = validReference(typeof body?.reference === "string" ? body.reference : "");
  if (!reference) {
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
