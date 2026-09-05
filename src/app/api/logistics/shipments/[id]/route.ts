import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getShipmentById, getTrackingEventsForShipment, updateShipmentRecord } from "@/lib/logistics/store";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { shipmentSchema } from "@/lib/logistics/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  if (shipment.userId !== caller.uid && caller.role !== "admin") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const events = await getTrackingEventsForShipment(id);
  return NextResponse.json({
    shipment,
    events: events.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  });
}

/**
 * Lets the license holder edit their own shipment's details (carrier,
 * service, sender/receiver, package, cost, insurance) — status changes stay
 * on the tracking-events route, which is what advances the public timeline.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  if (shipment.userId !== caller.uid && caller.role !== "admin") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = shipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid shipment data.", issues: parsed.error.issues }, { status: 400 });
  }
  const values = parsed.data;
  const carrier = getCarrier(values.carrierCode);

  const updatedShipment = {
    ...shipment,
    referenceNumber: values.referenceNumber || undefined,
    carrierCode: carrier.code,
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
    },
    specialInstructions: values.specialInstructions,
    estimatedDeliveryDate: values.estimatedDeliveryDate,
    shippingCost: values.shippingCost,
    insured: values.insured,
    insuranceValue: values.insured ? values.insuranceValue : undefined,
    updatedAt: new Date().toISOString(),
  };

  await updateShipmentRecord(updatedShipment);
  return NextResponse.json({ shipment: updatedShipment });
}
