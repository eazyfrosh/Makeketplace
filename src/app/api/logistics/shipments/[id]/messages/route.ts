import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyCaller, type AuthenticatedCaller } from "@/lib/licensing/verify-auth";
import {
  createShipmentMessage,
  getMessagesForShipment,
  getShipmentById,
  updateShipmentRecord,
} from "@/lib/logistics/store";
import type { Shipment, ShipmentMessage } from "@/lib/logistics/types";

const messageSchema = z.object({
  text: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long"),
});

/**
 * Shared by both the customer's shipment page and the admin shipment page —
 * same ownership-or-admin bypass as the tracking-events route, so a customer
 * can only read/send on their own shipment while an admin can reply on any.
 */
async function loadAuthorizedShipment(id: string, caller: AuthenticatedCaller): Promise<Shipment | null> {
  const shipment = await getShipmentById(id);
  if (!shipment) return null;
  if (shipment.userId !== caller.uid && caller.role !== "admin") return null;
  return shipment;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const shipment = await loadAuthorizedShipment(id, caller);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  const isAdmin = caller.role === "admin";
  if (isAdmin ? shipment.unreadForAdmin : shipment.unreadForCustomer) {
    await updateShipmentRecord({
      ...shipment,
      ...(isAdmin ? { unreadForAdmin: false } : { unreadForCustomer: false }),
    });
  }

  const messages = await getMessagesForShipment(id);
  return NextResponse.json({
    messages: messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const shipment = await loadAuthorizedShipment(id, caller);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
  }

  const isAdmin = caller.role === "admin";
  const message: ShipmentMessage = {
    id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    shipmentId: id,
    senderRole: isAdmin ? "admin" : "customer",
    senderName: isAdmin ? "Logistics Support" : shipment.sender.name || caller.email || "Customer",
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  };
  await createShipmentMessage(message);
  await updateShipmentRecord({
    ...shipment,
    unreadForAdmin: isAdmin ? (shipment.unreadForAdmin ?? false) : true,
    unreadForCustomer: isAdmin ? true : (shipment.unreadForCustomer ?? false),
  });

  return NextResponse.json({ message }, { status: 201 });
}
