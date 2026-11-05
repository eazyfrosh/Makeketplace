// Mirrors src/lib/licensing/store.ts's exact Admin-SDK-or-in-memory pattern,
// under its own collection names so it can never collide with anything the
// marketplace or the licensing system already uses.
import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import { createHash } from "node:crypto";
import type { Shipment, ShipmentEmailNotification, ShipmentMessage, TrackingEvent } from "@/lib/logistics/types";

export const isLogisticsBackendDurable = isAdminDbConfigured;

const SHIPMENTS = "logisticsShipments";
const EVENTS = "logisticsTrackingEvents";
const MESSAGES = "logisticsMessages";
const EMAILS = "logisticsEmailNotifications";
const EMAIL_LIMITS = "logisticsEmailRateLimits";
const PUBLIC_EMAIL_ATTEMPTS = "logisticsPublicEmailAttempts";

declare global {
  var __nexovaLogisticsDemoStore:
    | {
        shipments: Map<string, Shipment>;
        events: Map<string, TrackingEvent>;
        messages: Map<string, ShipmentMessage>;
        emails: Map<string, ShipmentEmailNotification>;
        emailLimits: Map<string, { windowStartedAt: number; count: number }>;
        publicEmailAttempts: Map<string, { windowStartedAt: number; count: number }>;
      }
    | undefined;
}

function demoStore() {
  if (!global.__nexovaLogisticsDemoStore) {
    global.__nexovaLogisticsDemoStore = { shipments: new Map(), events: new Map(), messages: new Map(), emails: new Map(), emailLimits: new Map(), publicEmailAttempts: new Map() };
  }
  global.__nexovaLogisticsDemoStore.emails ??= new Map();
  global.__nexovaLogisticsDemoStore.emailLimits ??= new Map();
  global.__nexovaLogisticsDemoStore.publicEmailAttempts ??= new Map();
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

export async function claimShipmentEmailSend(
  notification: ShipmentEmailNotification,
  options?: { limitKey?: string; maximum?: number },
): Promise<"claimed" | "duplicate"> {
  const configuredMaximum = Number(options?.maximum ?? process.env.LOGISTICS_EMAIL_RATE_LIMIT ?? 10);
  const maximum = Number.isSafeInteger(configuredMaximum) ? Math.max(1, Math.min(100, configuredMaximum)) : 10;
  const limitKey = options?.limitKey ?? notification.userId;
  if (adminDb) {
    const notificationRef = adminDb.collection(EMAILS).doc(notification.id);
    const limitRef = adminDb.collection(EMAIL_LIMITS).doc(limitKey);
    return adminDb.runTransaction(async (transaction) => {
      const [existing, limitSnapshot] = await Promise.all([transaction.get(notificationRef), transaction.get(limitRef)]);
      if (existing.exists) return "duplicate";

      const now = Date.now();
      const windowMs = 10 * 60 * 1000;
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
  const previous = store.emailLimits.get(limitKey);
  const inWindow = Boolean(previous && now - previous.windowStartedAt < 10 * 60 * 1000);
  const count = inWindow ? previous!.count : 0;
  if (count >= maximum) throw new Error("LOGISTICS_EMAIL_RATE_LIMITED");
  store.emails.set(notification.id, notification);
  store.emailLimits.set(limitKey, { windowStartedAt: inWindow ? previous!.windowStartedAt : now, count: count + 1 });
  return "claimed";
}

/** Limit wrong recipient guesses for a real shipment without locking out its recipient. */
export async function claimPublicTrackingEmailAttempt(shipmentId: string): Promise<boolean> {
  const key = createHash("sha256").update(shipmentId).digest("hex");
  const configuredMaximum = Number(process.env.LOGISTICS_PUBLIC_EMAIL_ATTEMPT_LIMIT ?? 8);
  const maximum = Number.isSafeInteger(configuredMaximum) ? Math.max(1, Math.min(50, configuredMaximum)) : 8;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  if (adminDb) {
    const ref = adminDb.collection(PUBLIC_EMAIL_ATTEMPTS).doc(key);
    return adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const previous = snapshot.data() as { windowStartedAt?: number; count?: number } | undefined;
      const inWindow = Boolean(previous?.windowStartedAt && now - previous.windowStartedAt < windowMs);
      const count = inWindow ? Number(previous?.count ?? 0) : 0;
      if (count >= maximum) return false;
      transaction.set(ref, { windowStartedAt: inWindow ? previous?.windowStartedAt : now, count: count + 1, updatedAt: new Date(now).toISOString() });
      return true;
    });
  }
  const store = demoStore();
  const previous = store.publicEmailAttempts.get(key);
  const inWindow = Boolean(previous && now - previous.windowStartedAt < windowMs);
  const count = inWindow ? previous!.count : 0;
  if (count >= maximum) return false;
  store.publicEmailAttempts.set(key, { windowStartedAt: inWindow ? previous!.windowStartedAt : now, count: count + 1 });
  return true;
}

export async function getShipmentEmailNotification(id: string): Promise<ShipmentEmailNotification | null> {
  if (adminDb) {
    const snapshot = await adminDb.collection(EMAILS).doc(id).get();
    return snapshot.exists ? (snapshot.data() as ShipmentEmailNotification) : null;
  }
  return demoStore().emails.get(id) ?? null;
}

export async function claimPendingShipmentEmailRetry(id: string): Promise<boolean> {
  const now = Date.now();
  const eligible = (notification: ShipmentEmailNotification | null) => {
    if (!notification || notification.status !== "pending") return false;
    const created = Date.parse(notification.createdAt);
    const attempted = Date.parse(notification.lastAttemptAt ?? notification.createdAt);
    // Resend keeps idempotency keys for 24 hours. Leave an hour of margin so
    // a retry cannot become a second email after that window expires.
    return Number.isFinite(created) && Number.isFinite(attempted) &&
      now - created >= 30_000 && now - created < 23 * 60 * 60 * 1000 && now - attempted >= 30_000;
  };
  if (adminDb) {
    const ref = adminDb.collection(EMAILS).doc(id);
    return adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const current = snapshot.exists ? snapshot.data() as ShipmentEmailNotification : null;
      if (!eligible(current)) return false;
      transaction.update(ref, { lastAttemptAt: new Date(now).toISOString() });
      return true;
    });
  }
  const store = demoStore();
  const current = store.emails.get(id) ?? null;
  if (!eligible(current)) return false;
  store.emails.set(id, { ...current!, lastAttemptAt: new Date(now).toISOString() });
  return true;
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
