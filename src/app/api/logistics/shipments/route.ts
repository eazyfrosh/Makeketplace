import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getLicenseForUserAndService } from "@/lib/licensing/store";
import { createShipmentRecord, createTrackingEvent, getShipmentsForUser, getTrackingEventsForShipment, updateShipmentRecord } from "@/lib/logistics/store";
import { generateShipmentNumber, generateTrackingNumber } from "@/lib/logistics/data/tracking-number";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { syncShipmentToTrackNova } from "@/lib/logistics/tracknova-sync";
import { TRACKING_EVENT_DESCRIPTION_TEMPLATES } from "@/lib/logistics/tracking-event-templates";
import { shipmentSchema } from "@/lib/logistics/validation";
import type { Shipment, TrackingEvent } from "@/lib/logistics/types";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const shipments = await getShipmentsForUser(caller.uid);
  // Repair older shipments created before the TrackNova bridge existed. Each
  // successful sync is marked locally so future list requests remain cheap.
  const pending = shipments
    .filter((shipment) => shipment.trackNovaSyncStatus !== "synced" || !shipment.trackNovaEventsSyncedAt)
    .slice(0, 20);
  await Promise.allSettled(
    pending.map(async (shipment) => {
      let events = await getTrackingEventsForShipment(shipment.id);
      if (events.length === 0) {
        const initialEvent: TrackingEvent = {
          id: `evt_initial_${shipment.id}`,
          shipmentId: shipment.id,
          status: shipment.status,
          location: `${shipment.sender.city}, ${shipment.sender.country}`,
          description: TRACKING_EVENT_DESCRIPTION_TEMPLATES[shipment.status],
          timestamp: shipment.createdAt,
          createdBy: "EazyTool",
        };
        await createTrackingEvent(initialEvent);
        events = [initialEvent];
      }

      const results = [];
      for (const event of events) results.push(await syncShipmentToTrackNova(shipment, event));
      if (results.every((result) => result.synced)) {
        shipment.trackNovaSyncStatus = "synced";
        shipment.trackNovaSyncedAt = new Date().toISOString();
        shipment.trackNovaEventsSyncedAt = new Date().toISOString();
        await updateShipmentRecord(shipment);
      }
    })
  );
  return NextResponse.json({
    shipments: shipments.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  // The client-side LicenseGuard is UX only — re-verify here that the caller
  // actually holds an active Tracking Page license before letting them
  // create data through the API directly.
  const license = await getLicenseForUserAndService(caller.uid, "logistics-platform");
  if (!license || license.status !== "active") {
    return NextResponse.json({ error: "An active Tracking Page license is required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = shipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid shipment data.", issues: parsed.error.issues }, { status: 400 });
  }
  const values = parsed.data;

  const carrier = getCarrier(values.carrierCode);
  const now = new Date().toISOString();
  const shipment: Shipment = {
    id: `shp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    shipmentNumber: generateShipmentNumber(),
    trackingNumber: generateTrackingNumber(carrier.code),
    referenceNumber: values.referenceNumber || undefined,
    carrierCode: carrier.code,
    status: "pending",
    serviceType: values.serviceType,
    sender: values.sender,
    receiver: values.receiver,
    package: {
      weightKg: values.weightKg,
      lengthCm: values.lengthCm,
      widthCm: values.widthCm,
      heightCm: values.heightCm,
      packageType: values.packageType,
      description: values.description,
      contentImageUrl: values.contentImageUrl,
    },
    specialInstructions: values.specialInstructions,
    estimatedDeliveryDate: values.estimatedDeliveryDate,
    shippingCost: values.shippingCost,
    insured: values.insured,
    insuranceValue: values.insured ? values.insuranceValue : undefined,
    userId: caller.uid,
    createdAt: now,
    updatedAt: now,
    trackNovaSyncStatus: "pending",
  };

  await createShipmentRecord(shipment);
  const initialEvent: TrackingEvent = {
    id: `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    shipmentId: shipment.id,
    status: "pending",
    location: `${shipment.sender.city}, ${shipment.sender.country}`,
    description: "Shipment created and awaiting carrier pickup.",
    timestamp: now,
    createdBy: caller.uid,
  };
  await createTrackingEvent(initialEvent);

  const syncResult = await syncShipmentToTrackNova(shipment, initialEvent);
  if (syncResult.synced) {
    shipment.trackNovaSyncStatus = "synced";
    shipment.trackNovaSyncedAt = new Date().toISOString();
    shipment.trackNovaEventsSyncedAt = new Date().toISOString();
    await updateShipmentRecord(shipment);
  }

  return NextResponse.json(
    {
      shipment,
      trackingUrl: `https://www.tracknova.app/track?q=${encodeURIComponent(shipment.trackingNumber)}`,
      trackingSync: syncResult.synced ? "synced" : "pending",
    },
    { status: 201 }
  );
}
