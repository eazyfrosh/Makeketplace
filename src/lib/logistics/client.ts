"use client";

import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { Shipment, TrackingEvent } from "@/lib/logistics/types";
import type { ShipmentFormValues } from "@/lib/logistics/validation";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...headers, ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export function createShipment(values: ShipmentFormValues): Promise<{ shipment: Shipment }> {
  return api("/api/logistics/shipments", { method: "POST", body: JSON.stringify(values) });
}

export function getMyShipments(): Promise<{ shipments: Shipment[] }> {
  return api("/api/logistics/shipments");
}

export function getShipment(id: string): Promise<{ shipment: Shipment; events: TrackingEvent[] }> {
  return api(`/api/logistics/shipments/${id}`);
}

export function addTrackingEvent(
  id: string,
  event: { status: string; location: string; description: string; notes?: string }
): Promise<{ event: TrackingEvent; shipment: Shipment }> {
  return api(`/api/logistics/shipments/${id}/events`, { method: "POST", body: JSON.stringify(event) });
}

export function trackPublic(
  trackingNumber: string
): Promise<{ shipment: Pick<Shipment, "trackingNumber" | "carrierCode" | "status" | "serviceType" | "estimatedDeliveryDate" | "createdAt"> & { sender: { city: string; country: string }; receiver: { city: string; country: string } }; events: TrackingEvent[] }> {
  return api(`/api/logistics/track?trackingNumber=${encodeURIComponent(trackingNumber)}`);
}
