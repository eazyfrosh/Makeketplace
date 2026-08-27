import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getShipmentById, getTrackingEventsForShipment } from "@/lib/logistics/store";

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
