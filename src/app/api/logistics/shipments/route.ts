import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getLicenseForUserAndService } from "@/lib/licensing/store";
import { createShipmentRecord, getShipmentsForUser } from "@/lib/logistics/store";
import { generateShipmentNumber, generateTrackingNumber } from "@/lib/logistics/data/tracking-number";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { shipmentSchema } from "@/lib/logistics/validation";
import type { Shipment } from "@/lib/logistics/types";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const shipments = await getShipmentsForUser(caller.uid);
  return NextResponse.json({
    shipments: shipments.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  // The client-side LicenseGuard is UX only — re-verify here that the caller
  // actually holds an active Logistics Platform license before letting them
  // create data through the API directly.
  const license = await getLicenseForUserAndService(caller.uid, "logistics-platform");
  if (!license || license.status !== "active") {
    return NextResponse.json({ error: "An active Logistics Platform license is required." }, { status: 403 });
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
    },
    specialInstructions: values.specialInstructions,
    estimatedDeliveryDate: values.estimatedDeliveryDate,
    shippingCost: values.shippingCost,
    insured: values.insured,
    insuranceValue: values.insured ? values.insuranceValue : undefined,
    userId: caller.uid,
    createdAt: now,
    updatedAt: now,
  };

  await createShipmentRecord(shipment);
  return NextResponse.json({ shipment }, { status: 201 });
}
