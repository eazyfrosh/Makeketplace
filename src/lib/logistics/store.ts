// Mirrors src/lib/licensing/store.ts's exact Admin-SDK-or-in-memory pattern,
// under its own collection names so it can never collide with anything the
// marketplace or the licensing system already uses.
import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import type { Shipment, ShipmentMessage, TrackingEvent } from "@/lib/logistics/types";

export const isLogisticsBackendDurable = isAdminDbConfigured;

const SHIPMENTS = "logisticsShipments";
const EVENTS = "logisticsTrackingEvents";
const MESSAGES = "logisticsMessages";

declare global {
  var __nexovaLogisticsDemoStore:
    | {
        shipments: Map<string, Shipment>;
        events: Map<string, TrackingEvent>;
        messages: Map<string, ShipmentMessage>;
      }
    | undefined;
}

function demoStore() {
  if (!global.__nexovaLogisticsDemoStore) {
    global.__nexovaLogisticsDemoStore = { shipments: new Map(), events: new Map(), messages: new Map() };
  }
  return global.__nexovaLogisticsDemoStore;
}

// Firestore's set() throws on any field explicitly valued `undefined` (e.g.
// insuranceValue when insured is false) — strip those before every write.
function stripUndefined<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function createShipmentRecord(shipment: Shipment): Promise<void> {
  if (adminDb) {
    await adminDb.collection(SHIPMENTS).doc(shipment.id).set(stripUndefined(shipment));
    return;
  }
  demoStore().shipments.set(shipment.id, shipment);
}

export async function updateShipmentRecord(shipment: Shipment): Promise<void> {
  if (adminDb) {
    await adminDb.collection(SHIPMENTS).doc(shipment.id).set(stripUndefined(shipment));
    return;
  }
  demoStore().shipments.set(shipment.id, shipment);
}

export async function getAllShipments(): Promise<Shipment[]> {
  if (adminDb) {
    const snap = await adminDb.collection(SHIPMENTS).get();
    return snap.docs.map((d) => d.data() as Shipment);
  }
  return Array.from(demoStore().shipments.values());
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
  if (adminDb) {
    const snap = await adminDb.collection(SHIPMENTS).doc(id).get();
    return snap.exists ? (snap.data() as Shipment) : null;
  }
  return demoStore().shipments.get(id) ?? null;
}

export async function getShipmentsForUser(userId: string): Promise<Shipment[]> {
  if (adminDb) {
    const snap = await adminDb.collection(SHIPMENTS).where("userId", "==", userId).get();
    return snap.docs.map((d) => d.data() as Shipment);
  }
  return Array.from(demoStore().shipments.values()).filter((s) => s.userId === userId);
}

export async function getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
  if (adminDb) {
    const snap = await adminDb.collection(SHIPMENTS).where("trackingNumber", "==", trackingNumber).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as Shipment);
  }
  return (
    Array.from(demoStore().shipments.values()).find((s) => s.trackingNumber === trackingNumber) ?? null
  );
}

export async function createTrackingEvent(event: TrackingEvent): Promise<void> {
  if (adminDb) {
    await adminDb.collection(EVENTS).doc(event.id).set(event);
    return;
  }
  demoStore().events.set(event.id, event);
}

export async function getTrackingEventsForShipment(shipmentId: string): Promise<TrackingEvent[]> {
  if (adminDb) {
    const snap = await adminDb.collection(EVENTS).where("shipmentId", "==", shipmentId).get();
    return snap.docs.map((d) => d.data() as TrackingEvent);
  }
  return Array.from(demoStore().events.values()).filter((e) => e.shipmentId === shipmentId);
}

export async function createShipmentMessage(message: ShipmentMessage): Promise<void> {
  if (adminDb) {
    await adminDb.collection(MESSAGES).doc(message.id).set(stripUndefined(message));
    return;
  }
  demoStore().messages.set(message.id, message);
}

export async function getMessagesForShipment(shipmentId: string): Promise<ShipmentMessage[]> {
  if (adminDb) {
    const snap = await adminDb.collection(MESSAGES).where("shipmentId", "==", shipmentId).get();
    return snap.docs.map((d) => d.data() as ShipmentMessage);
  }
  return Array.from(demoStore().messages.values()).filter((m) => m.shipmentId === shipmentId);
}
