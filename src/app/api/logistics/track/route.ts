import { NextResponse } from "next/server";

import { getShipmentByTrackingNumber, getTrackingEventsForShipment } from "@/lib/logistics/store";

/**
 * Public lookup by tracking number — no license or sign-in required, mirrors
 * a real carrier's public tracking page. Returns only a sanitized, public-
 * safe projection: no raw database id, no full sender/receiver contact
 * details (just city/country), no internal userId.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get("trackingNumber")?.trim();
  if (!trackingNumber) {
    return NextResponse.json({ error: "trackingNumber is required." }, { status: 400 });
  }

  const shipment = await getShipmentByTrackingNumber(trackingNumber);
  if (!shipment) return NextResponse.json({ error: "No shipment found for that tracking number." }, { status: 404 });

  const events = await getTrackingEventsForShipment(shipment.id);

  return NextResponse.json({
    shipment: {
      trackingNumber: shipment.trackingNumber,
      carrierCode: shipment.carrierCode,
      status: shipment.status,
      serviceType: shipment.serviceType,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
      createdAt: shipment.createdAt,
      sender: { city: shipment.sender.city, country: shipment.sender.country },
      receiver: { city: shipment.receiver.city, country: shipment.receiver.country },
    },
    events: events
      .map((e) => ({ id: e.id, status: e.status, location: e.location, description: e.description, timestamp: e.timestamp }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  });
}
