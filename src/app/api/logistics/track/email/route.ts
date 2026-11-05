import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isShipmentEmailConfigured, submitShipmentEmail } from "@/lib/logistics/email-service";
import { renderShipmentStatusEmail } from "@/lib/logistics/email-templates";
import {
  claimPublicTrackingEmailAttempt,
  getShipmentByTrackingNumber,
  getTrackingEventsForShipment,
  isLogisticsBackendDurable,
} from "@/lib/logistics/store";
import type { ShipmentEmailNotification, TrackingEvent } from "@/lib/logistics/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  trackingNumber: z.string().trim().min(5).max(40).regex(/^[A-Za-z0-9-]+$/),
  recipientEmail: z.email().max(254),
  recipientConfirmed: z.literal(true),
});

const genericMessage = "If this address matches the shipment recipient, we will try to email the current tracking details.";

function sameEmail(left: string, right: string) {
  const digest = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest();
  return timingSafeEqual(digest(left), digest(right));
}

export async function POST(request: Request) {
  if (!isLogisticsBackendDurable || !isShipmentEmailConfigured()) {
    return NextResponse.json({ error: "Tracking email is temporarily unavailable. Please try again later." }, { status: 503 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid tracking number and recipient email." }, { status: 400 });
  const trackingNumber = parsed.data.trackingNumber.toUpperCase();
  const recipientEmail = parsed.data.recipientEmail.trim().toLowerCase();

  try {
    const shipment = await getShipmentByTrackingNumber(trackingNumber);
    if (!shipment) return NextResponse.json({ message: genericMessage }, { status: 202 });
    if (!sameEmail(recipientEmail, shipment.receiver.email)) {
      // Limit guesses without allowing them to block the actual recipient.
      // The response stays identical whether the address matched or was limited.
      await claimPublicTrackingEmailAttempt(shipment.id);
      return NextResponse.json({ message: genericMessage }, { status: 202 });
    }

    const events = await getTrackingEventsForShipment(shipment.id);
    const latest = events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    const event: TrackingEvent = latest?.status === shipment.status ? latest : {
      id: `current_${shipment.id}`,
      shipmentId: shipment.id,
      status: shipment.status,
      location: shipment.receiver.city ? `${shipment.receiver.city}, ${shipment.receiver.country}` : shipment.receiver.country,
      description: `Shipment status updated to ${shipment.status.replaceAll("_", " ")}.`,
      timestamp: shipment.updatedAt,
    };
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://eazytool.app").replace(/\/$/, "");
    const trackingUrl = `${appUrl}/track-shipment/${encodeURIComponent(shipment.trackingNumber)}`;
    // Match the public preview exactly and keep private contact details and
    // internal notes out of emails requested from an anonymous tracking page.
    const rendered = renderShipmentStatusEmail({
      shipment: { trackingNumber: shipment.trackingNumber, estimatedDeliveryDate: shipment.estimatedDeliveryDate, receiver: {} },
      event: { status: event.status, location: event.location, description: event.description, timestamp: event.timestamp },
      trackingUrl,
    });
    const now = new Date().toISOString();
    // One email per recipient and tracking update each hour. This identity is
    // shared across browser retries, so parallel taps cannot send duplicates.
    const hour = Math.floor(Date.now() / (60 * 60 * 1000));
    const hash = createHash("sha256").update(`public|${shipment.id}|${event.id}|${recipientEmail}|${hour}`).digest("hex").slice(0, 32);
    const notification: ShipmentEmailNotification = {
      id: `logemail_${hash}`,
      userId: shipment.userId,
      shipmentId: shipment.id,
      eventId: event.id,
      trackingNumber: shipment.trackingNumber,
      shipmentStatus: event.status,
      recipientEmail: shipment.receiver.email.trim().toLowerCase(),
      subject: rendered.subject,
      provider: "resend",
      source: "public_tracking",
      status: "pending",
      lastAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const limit = Number(process.env.LOGISTICS_PUBLIC_EMAIL_SEND_LIMIT ?? 3);
    await submitShipmentEmail(notification, rendered, {
      limitKey: `public_${shipment.id}`,
      maximum: Number.isSafeInteger(limit) ? limit : 3,
    });
    return NextResponse.json({ message: genericMessage }, { status: 202 });
  } catch (error) {
    // The public endpoint must not reveal whether the supplied address matched.
    console.error("[logistics-email] public request deferred", { reason: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ message: genericMessage }, { status: 202 });
  }
}
