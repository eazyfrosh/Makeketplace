import { NextResponse } from "next/server";
import { itineraryEmailSubject, renderItineraryEmail } from "@/lib/airline/email/itinerary-email";
import {
  AirlineBookingOwnershipError,
  AirlineBookingStoreUnavailableError,
  getOwnedBooking,
} from "@/lib/airline/server-bookings";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestIdPattern = /^[a-zA-Z0-9_-]{8,100}$/;

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isEmailConfigured) {
    return NextResponse.json({ error: "Email delivery is not configured yet." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const recipient = typeof body?.recipient === "string" ? body.recipient.trim().toLowerCase() : "";
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  if (!emailPattern.test(recipient) || recipient.length > 254) {
    return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 });
  }
  if (!bookingId || bookingId.length > 120 || !requestIdPattern.test(requestId)) {
    return NextResponse.json({ error: "The email request is invalid." }, { status: 400 });
  }

  try {
    const booking = await getOwnedBooking(bookingId, caller.uid);
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    const content = renderItineraryEmail(booking, origin);
    const result = await sendEmail({
      to: recipient,
      subject: itineraryEmailSubject(booking),
      html: content.html,
      text: content.text,
      attachments: content.attachments.map((attachment) => ({
        path: attachment.path,
        filename: attachment.filename,
        contentId: attachment.content_id,
        contentType: attachment.content_type,
      })),
      idempotencyKey: `airline-itinerary-${caller.uid}-${requestId}`,
    });
    return NextResponse.json({ sent: true, id: result.id });
  } catch (error) {
    if (error instanceof AirlineBookingOwnershipError) {
      return NextResponse.json({ error: "Booking access denied." }, { status: 403 });
    }
    if (error instanceof AirlineBookingStoreUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[airline/email/itinerary]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The confirmation email could not be sent." },
      { status: 502 },
    );
  }
}
