import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getShipmentById, createTrackingEvent, updateShipmentRecord } from "@/lib/logistics/store";
import { SHIPMENT_STATUSES } from "@/lib/logistics/types";

const eventSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
});

/**
 * Lets the license holder advance their own shipment's status — standing in
 * for "the carrier updated it" since this ported platform has no real
 * carrier integration behind it.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  if (shipment.userId !== caller.uid && caller.role !== "admin") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tracking event.", issues: parsed.error.issues }, { status: 400 });
  }
  const values = parsed.data;

  const now = new Date().toISOString();
  const event = {
    id: `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    shipmentId: id,
    status: values.status,
    location: values.location,
    description: values.description,
    notes: values.notes,
    timestamp: now,
    createdBy: caller.uid,
  };

  await createTrackingEvent(event);
  const updatedShipment = { ...shipment, status: values.status, updatedAt: now };
  await updateShipmentRecord(updatedShipment);

  return NextResponse.json({ event, shipment: updatedShipment }, { status: 201 });
}
