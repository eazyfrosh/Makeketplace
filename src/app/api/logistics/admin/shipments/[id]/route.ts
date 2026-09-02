import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import {
  getMessagesForShipment,
  getShipmentById,
  getTrackingEventsForShipment,
  updateShipmentRecord,
} from "@/lib/logistics/store";
import { PACKAGE_TYPES, SERVICE_TYPES } from "@/lib/logistics/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  const [events, messages] = await Promise.all([
    getTrackingEventsForShipment(id),
    getMessagesForShipment(id),
  ]);

  return NextResponse.json({
    shipment,
    events: events.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    messages: messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  });
}

const contactSchema = z.object({
  name: z.string().min(2, "Required"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(5, "Required"),
  address: z.string().min(3, "Required"),
  city: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  postalCode: z.string().min(1, "Required"),
});

const packageSchema = z.object({
  weightKg: z.coerce.number().positive("Must be greater than 0"),
  lengthCm: z.coerce.number().positive("Must be greater than 0"),
  widthCm: z.coerce.number().positive("Must be greater than 0"),
  heightCm: z.coerce.number().positive("Must be greater than 0"),
  packageType: z.enum(PACKAGE_TYPES),
  description: z.string().optional(),
});

// Edits the shipment's own core fields — separate from the tracking-events
// route, which is what advances `status` and appends to the timeline.
const adminUpdateSchema = z.object({
  carrierCode: z.string().min(1, "Required").optional(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  referenceNumber: z.string().optional(),
  sender: contactSchema.optional(),
  receiver: contactSchema.optional(),
  package: packageSchema.optional(),
  specialInstructions: z.string().optional(),
  estimatedDeliveryDate: z.string().min(1, "Required").optional(),
  shippingCost: z.coerce.number().min(0, "Must be 0 or greater").optional(),
  insured: z.boolean().optional(),
  insuranceValue: z.coerce.number().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = adminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid shipment data.", issues: parsed.error.issues }, { status: 400 });
  }
  const updates = parsed.data;

  const insured = updates.insured ?? shipment.insured;
  const updatedShipment = {
    ...shipment,
    ...updates,
    insured,
    insuranceValue: insured ? (updates.insuranceValue ?? shipment.insuranceValue) : undefined,
    updatedAt: new Date().toISOString(),
  };

  await updateShipmentRecord(updatedShipment);
  return NextResponse.json({ shipment: updatedShipment });
}
