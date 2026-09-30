import { NextResponse } from "next/server";
import { z } from "zod";

import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { renderShipmentStatusEmail } from "@/lib/logistics/email-templates";
import {
  claimShipmentEmailSend,
  getShipmentById,
  getShipmentEmailNotification,
  getShipmentEmails,
  getTrackingEventsForShipment,
  updateShipmentEmailNotification,
} from "@/lib/logistics/store";
import type { ShipmentEmailNotification, TrackingEvent } from "@/lib/logistics/types";
import { verifyCaller } from "@/lib/licensing/verify-auth";

const sendSchema = z.object({
  recipientEmail: z.email("Enter a valid recipient email address.").max(254),
  eventId: z.string().min(1).max(160).optional(),
  requestId: z.string().regex(/^logemail_[A-Za-z0-9_-]{12,120}$/),
  recipientConfirmed: z.literal(true),
});

function syntheticEvent(shipmentId: string, shipment: Awaited<ReturnType<typeof getShipmentById>>): TrackingEvent {
  if (!shipment) throw new Error("Shipment not found.");
  return {
    id: `current_${shipment.id}`,
    shipmentId,
    status: shipment.status,
    location: shipment.receiver.city ? `${shipment.receiver.city}, ${shipment.receiver.country}` : shipment.receiver.country,
    description: `Shipment status updated to ${shipment.status.replaceAll("_", " ")}.`,
    timestamp: shipment.updatedAt,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment || (shipment.userId !== caller.uid && caller.role !== "admin")) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  return NextResponse.json({ notifications: await getShipmentEmails(id, shipment.userId), emailConfigured: isEmailConfigured });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment || (shipment.userId !== caller.uid && caller.role !== "admin")) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid email details." }, { status: 400 });
  if (!isEmailConfigured) return NextResponse.json({ error: "Shipment email delivery is not configured yet." }, { status: 503 });

  const events = await getTrackingEventsForShipment(id);
  const sortedEvents = events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const event = parsed.data.eventId ? sortedEvents.find((item) => item.id === parsed.data.eventId) : sortedEvents[0] ?? syntheticEvent(id, shipment);
  if (!event) return NextResponse.json({ error: "The selected tracking update was not found." }, { status: 404 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://eazytool.app").replace(/\/$/, "");
  const trackingUrl = `${appUrl}/track-shipment/${encodeURIComponent(shipment.trackingNumber)}`;
  const rendered = renderShipmentStatusEmail({ shipment, event, trackingUrl });
  const now = new Date().toISOString();
  const notification: ShipmentEmailNotification = {
    id: parsed.data.requestId,
    userId: shipment.userId,
    shipmentId: id,
    eventId: event.id,
    trackingNumber: shipment.trackingNumber,
    shipmentStatus: event.status,
    recipientEmail: parsed.data.recipientEmail.trim().toLowerCase(),
    subject: rendered.subject,
    provider: "resend",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  try {
    const claim = await claimShipmentEmailSend(notification);
    if (claim === "duplicate") {
      const existing = await getShipmentEmailNotification(notification.id);
      if (existing?.userId !== shipment.userId || existing.shipmentId !== id) return NextResponse.json({ error: "This request reference is unavailable." }, { status: 409 });
      return NextResponse.json({ notification: existing, duplicate: true });
    }

    const result = await sendEmail({
      to: notification.recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: notification.id,
      from: process.env.LOGISTICS_EMAIL_FROM ?? process.env.EMAIL_FROM,
    });
    const completed: ShipmentEmailNotification = { ...notification, providerMessageId: result.id, status: "sent", updatedAt: new Date().toISOString() };
    await updateShipmentEmailNotification(completed);
    return NextResponse.json({ notification: completed }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email could not be sent.";
    if (message === "LOGISTICS_EMAIL_RATE_LIMITED") return NextResponse.json({ error: "Too many shipment emails were sent. Please wait a few minutes and try again." }, { status: 429 });
    await updateShipmentEmailNotification({ ...notification, status: "failed", errorMessage: "Email delivery failed.", updatedAt: new Date().toISOString() }).catch(() => undefined);
    console.error("[logistics-email] send failed", error);
    return NextResponse.json({ error: "The shipment email could not be sent. Please try again." }, { status: 502 });
  }
}
