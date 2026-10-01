import { NextResponse } from "next/server";
import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { isBooking, publicVerificationBooking } from "@/lib/airline/booking-record";

const COLLECTION = "airlineBookingVerifications";
const ALLOWED_ORIGIN = "https://flightbook-dusky.vercel.app";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function normalizeLookup(reference: string, token: string) {
  const ref = reference.trim().toUpperCase();
  const tok = token.trim();
  if (!/^[A-Z0-9-]{4,32}$/.test(ref) || !/^[A-Za-z0-9_-]{16,256}$/.test(tok)) {
    return null;
  }
  return { ref, tok, id: `${ref}_${tok}` };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lookup = normalizeLookup(
    url.searchParams.get("reference") ?? "",
    url.searchParams.get("token") ?? "",
  );
  if (!lookup) {
    return NextResponse.json({ error: "Invalid verification link." }, { status: 400, headers: corsHeaders() });
  }
  if (!isAdminDbConfigured || !adminDb) {
    return NextResponse.json({ error: "Verification service unavailable." }, { status: 503, headers: corsHeaders() });
  }

  const snapshot = await adminDb.collection(COLLECTION).doc(lookup.id).get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404, headers: corsHeaders() });
  }
  return NextResponse.json({ booking: snapshot.data()?.booking ?? null }, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isAdminDbConfigured || !adminDb) {
    return NextResponse.json({ error: "Verification service unavailable." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 250_000) {
    return NextResponse.json({ error: "Booking record is too large." }, { status: 413 });
  }
  const body = await request.json().catch(() => null);
  const booking = body?.booking;
  if (!isBooking(booking)) {
    return NextResponse.json({ error: "Invalid booking record." }, { status: 400 });
  }
  if (booking.userId !== caller.uid && caller.role !== "admin") {
    return NextResponse.json({ error: "You cannot publish this booking." }, { status: 403 });
  }
  const lookup = normalizeLookup(booking.bookingReference, booking.verificationToken);
  if (!lookup) {
    return NextResponse.json({ error: "Invalid verification credentials." }, { status: 400 });
  }

  const safeBooking = publicVerificationBooking(booking);
  await adminDb.collection(COLLECTION).doc(lookup.id).set({
    ownerId: booking.userId,
    booking: safeBooking,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
