import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getShipmentsForUser, getTrackingEventsForShipment } from "@/lib/logistics/store";

const TRACKNOVA_APP_URL = "https://www.tracknova.app";

/**
 * Single sign-on handoff: mints a TrackNova (tracknova.app) session for the
 * same email a licensee already used on Nexova's Logistics Platform, so
 * "Open in TrackNova" doesn't ask them to create a second identity. The
 * token itself is minted server-to-server by tracknova.app's own Admin SDK
 * — this route never touches Firebase credentials for that project.
 *
 * Also forwards every shipment (with its full tracking-event history) on
 * every handoff, which tracknova.app mirrors onto its own account — the two
 * apps otherwise have nothing in common, so without this TrackNova always
 * shows whatever it bootstrapped a new account with (nothing).
 */
export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const sharedSecret = process.env.TRACKNOVA_SSO_SHARED_SECRET;
  if (!sharedSecret) {
    return NextResponse.json({ error: "TrackNova single sign-on is not configured." }, { status: 501 });
  }
  if (!caller.email) {
    return NextResponse.json({ error: "Your account needs an email on file to use TrackNova." }, { status: 400 });
  }

  const shipments = await getShipmentsForUser(caller.uid);
  const shipmentsWithEvents = await Promise.all(
    shipments.map(async (shipment) => ({
      ...shipment,
      events: await getTrackingEventsForShipment(shipment.id),
    })),
  );

  // TrackNova needs a display name and has no separate first/last name
  // fields the way Banking does — the sender's name on the licensee's own
  // shipments is the closest thing Nexova's Logistics Platform has to one.
  const displayName = shipments[0]?.sender.name || caller.email.split("@")[0];

  let token: string;
  try {
    const res = await fetch(`${TRACKNOVA_APP_URL}/api/sso/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sso-secret": sharedSecret },
      body: JSON.stringify({
        email: caller.email,
        displayName,
        shipments: shipmentsWithEvents.map((s) => ({
          id: s.id,
          shipmentNumber: s.shipmentNumber,
          trackingNumber: s.trackingNumber,
          referenceNumber: s.referenceNumber,
          carrierCode: s.carrierCode,
          status: s.status,
          serviceType: s.serviceType,
          sender: s.sender,
          receiver: s.receiver,
          package: s.package,
          specialInstructions: s.specialInstructions,
          estimatedDeliveryDate: s.estimatedDeliveryDate,
          shippingCost: s.shippingCost,
          insured: s.insured,
          insuranceValue: s.insuranceValue,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          events: s.events.map((e) => ({
            id: e.id,
            status: e.status,
            location: e.location,
            description: e.description,
            notes: e.notes,
            timestamp: e.timestamp,
          })),
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      console.error("[logistics/sso/tracknova] provision failed:", res.status, data);
      return NextResponse.json({ error: data.error ?? "TrackNova could not provision your account." }, { status: 502 });
    }
    token = data.token;
  } catch (err) {
    console.error("[logistics/sso/tracknova] request to tracknova.app failed:", err);
    return NextResponse.json({ error: "Could not reach TrackNova right now." }, { status: 502 });
  }

  return NextResponse.json({ redirectUrl: `${TRACKNOVA_APP_URL}/sso?token=${encodeURIComponent(token)}` });
}
