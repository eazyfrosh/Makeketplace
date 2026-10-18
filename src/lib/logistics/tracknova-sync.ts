import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import type { Shipment, TrackingEvent } from "@/lib/logistics/types";

const DEFAULT_TRACKNOVA_ORIGIN = "https://www.tracknova.app";

export type TrackNovaSyncResult =
  | { synced: true; duplicate: boolean }
  | { synced: false; reason: "not_configured" | "request_failed" };

function getTrackNovaEndpoint() {
  const configuredOrigin = process.env.TRACKNOVA_APP_ORIGIN?.trim() || DEFAULT_TRACKNOVA_ORIGIN;
  const origin = new URL(configuredOrigin);
  if (origin.protocol !== "https:" && origin.hostname !== "localhost" && origin.hostname !== "127.0.0.1") {
    throw new Error("TRACKNOVA_APP_ORIGIN must use HTTPS.");
  }
  return new URL("/api/integrations/eazytools/shipments", origin).toString();
}

function publicShipment(shipment: Shipment) {
  return {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    shipmentNumber: shipment.shipmentNumber,
    referenceNumber: shipment.referenceNumber,
    carrierCode: shipment.carrierCode,
    status: shipment.status,
    serviceType: shipment.serviceType,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate,
    weightKg: shipment.package.weightKg,
    sender: {
      name: shipment.sender.name,
      city: shipment.sender.city,
      country: shipment.sender.country,
    },
    receiver: {
      name: shipment.receiver.name,
      city: shipment.receiver.city,
      country: shipment.receiver.country,
    },
    updatedAt: shipment.updatedAt,
  };
}

function publicEvent(event: TrackingEvent | undefined) {
  if (!event) return undefined;
  return {
    id: event.id,
    shipmentId: event.shipmentId,
    status: event.status,
    location: event.location,
    description: event.description,
    notes: event.notes,
    timestamp: event.timestamp,
    createdBy: "EazyTool",
  };
}

export async function syncShipmentToTrackNova(
  shipment: Shipment,
  event?: TrackingEvent
): Promise<TrackNovaSyncResult> {
  const secret = process.env.TRACKNOVA_SSO_SHARED_SECRET?.trim();
  if (!secret) {
    console.error("TrackNova shipment sync skipped: TRACKNOVA_SSO_SHARED_SECRET is not configured.");
    return { synced: false, reason: "not_configured" };
  }

  const syncId = event ? `event:${event.id}` : `shipment:${shipment.id}:${shipment.updatedAt}`;
  const body = JSON.stringify({ syncId, shipment: publicShipment(shipment), event: publicEvent(event) });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}\n${nonce}\n${body}`)
    .digest("hex");

  try {
    const response = await fetch(getTrackNovaEndpoint(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-eazytool-timestamp": timestamp,
        "x-eazytool-nonce": nonce,
        "x-eazytool-signature": signature,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      console.error("TrackNova shipment sync failed.", {
        shipmentId: shipment.id,
        status: response.status,
      });
      return { synced: false, reason: "request_failed" };
    }

    const result = (await response.json().catch(() => null)) as { result?: string } | null;
    return { synced: true, duplicate: result?.result === "duplicate" };
  } catch (error) {
    console.error("TrackNova shipment sync request failed.", {
      shipmentId: shipment.id,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { synced: false, reason: "request_failed" };
  }
}
