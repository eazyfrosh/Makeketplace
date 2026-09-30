// Mirrors src/lib/licensing/store.ts's exact Admin-SDK-or-in-memory pattern,
// under its own collection names so it can never collide with anything the
// marketplace or the licensing system already uses.
import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import type { Shipment, ShipmentEmailNotification, ShipmentMessage, TrackingEvent } from "@/lib/logistics/types";

export const isLogisticsBackendDurable = isAdminDbConfigured;

const SHIPMENTS = "logisticsShipments";
const EVENTS = "logisticsTrackingEvents";
const MESSAGES = "logisticsMessages";
const EMAILS = "logisticsEmailNotifications";
const EMAIL_LIMITS = "logisticsEmailRateLimits";

declare global {
  var __nexovaLogisticsDemoStore:
    | {
        shipments: Map<string, Shipment>;
        events: Map<string, TrackingEvent>;
        messages: Map<string, ShipmentMessage>;
        emails: Map<string, ShipmentEmailNotification>;
        emailLimits: Map<string, { windowStartedAt: number; count: number }>;
      }
    | undefined;
}

function demoStore() {
  if (!global.__nexovaLogisticsDemoStore) {
    global.__nexovaLogisticsDemoStore = { shipments: new Map(), events: new Map(), messages: new Map(), emails: new Map(), emailLimits: new Map() };
  }
  global.__nexovaLogisticsDemoStore.emails ??= new Map();
  global.__nexovaLogisticsDemoStore.emailLimits ??= new Map();
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

export async function claimShipmentEmailSend(notification: ShipmentEmailNotification): Promise<"claimed" | "duplicate"> {
  if (adminDb) {
    const notificationRef = adminDb.collection(EMAILS).doc(notification.id);
    const limitRef = adminDb.collection(EMAIL_LIMITS).doc(notification.userId);
    return adminDb.runTransaction(async (transaction) => {
      const [existing, limitSnapshot] = await Promise.all([transaction.get(notificationRef), transaction.get(limitRef)]);
      if (existing.exists) return "duplicate";

      const now = Date.now();
      const windowMs = 10 * 60 * 1000;
      const maximum = Math.max(1, Number(process.env.LOGISTICS_EMAIL_RATE_LIMIT ?? 10));
      const previous = limitSnapshot.data() as { windowStartedAt?: number; count?: number } | undefined;
      const inWindow = previous?.windowStartedAt && now - previous.windowStartedAt < windowMs;
      const count = inWindow ? Number(previous?.count ?? 0) : 0;
      if (count >= maximum) throw new Error("LOGISTICS_EMAIL_RATE_LIMITED");

      transaction.create(notificationRef, stripUndefined(notification));
      transaction.set(limitRef, { windowStartedAt: inWindow ? previous?.windowStartedAt : now, count: count + 1, updatedAt: notification.createdAt });
      return "claimed";
    });
  }

  const store = demoStore();
  if (store.emails.has(notification.id)) return "duplicate";
  const now = Date.now();
  const previous = store.emailLimits.get(notification.userId);
  const inWindow = Boolean(previous && now - previous.windowStartedAt < 10 * 60 * 1000);
  const count = inWindow ? previous!.count : 0;
  const maximum = Math.max(1, Number(process.env.LOGISTICS_EMAIL_RATE_LIMIT ?? 10));
  if (count >= maximum) throw new Error("LOGISTICS_EMAIL_RATE_LIMITED");
  store.emails.set(notification.id, notification);
  store.emailLimits.set(notification.userId, { windowStartedAt: inWindow ? previous!.windowStartedAt : now, count: count + 1 });
  return "claimed";
}

export async function getShipmentEmailNotification(id: string): Promise<ShipmentEmailNotification | null> {
  if (adminDb) {
    const snapshot = await adminDb.collection(EMAILS).doc(id).get();
    return snapshot.exists ? (snapshot.data() as ShipmentEmailNotification) : null;
  }
  return demoStore().emails.get(id) ?? null;
}

export async function updateShipmentEmailNotification(notification: ShipmentEmailNotification): Promise<void> {
  if (adminDb) {
    await adminDb.collection(EMAILS).doc(notification.id).set(stripUndefined(notification));
    return;
  }
  demoStore().emails.set(notification.id, notification);
}

export async function getShipmentEmails(shipmentId: string, userId: string): Promise<ShipmentEmailNotification[]> {
  if (adminDb) {
    const snapshot = await adminDb.collection(EMAILS).where("shipmentId", "==", shipmentId).get();
    return snapshot.docs.map((document) => document.data() as ShipmentEmailNotification).filter((item) => item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return Array.from(demoStore().emails.values()).filter((item) => item.shipmentId === shipmentId && item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
