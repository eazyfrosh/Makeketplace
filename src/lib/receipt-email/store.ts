import "server-only";

import { adminDb } from "@/lib/licensing/admin-db";
import type { ReceiptEmailSend, ReceiptEmailTemplate } from "@/lib/receipt-email/types";

const TEMPLATES = "receiptEmailTemplates";
const SENDS = "receiptEmailSends";
const AUDIT = "receiptEmailAuditLogs";
const LIMITS = "receiptEmailRateLimits";

function db() {
  if (!adminDb) throw new Error("Receipt email storage is unavailable. Configure Firebase Admin credentials.");
  return adminDb;
}

export async function listReceiptTemplates(userId: string) {
  const snap = await db().collection(TEMPLATES).where("userId", "==", userId).get();
  return snap.docs.map((doc) => doc.data() as ReceiptEmailTemplate).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getReceiptTemplate(id: string) {
  const snap = await db().collection(TEMPLATES).doc(id).get();
  return snap.exists ? snap.data() as ReceiptEmailTemplate : null;
}

export async function saveReceiptTemplate(template: ReceiptEmailTemplate) {
  await db().collection(TEMPLATES).doc(template.id).set(template);
  return template;
}

export async function deleteReceiptTemplate(id: string, userId: string) {
  const ref = db().collection(TEMPLATES).doc(id);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data()?.userId !== userId) throw new Error("Template not found.");
    tx.delete(ref);
  });
}

export async function createReceiptSend(send: ReceiptEmailSend) {
  await db().collection(SENDS).doc(send.id).create(send);
}

export async function getReceiptSend(id: string) {
  const snap = await db().collection(SENDS).doc(id).get();
  return snap.exists ? snap.data() as ReceiptEmailSend : null;
}

export async function updateReceiptSend(id: string, update: Partial<ReceiptEmailSend>) {
  await db().collection(SENDS).doc(id).set(update, { merge: true });
}

export async function listReceiptSends(userId: string, limit = 50) {
  const snap = await db().collection(SENDS).where("userId", "==", userId).limit(Math.min(limit, 100)).get();
  return snap.docs.map((doc) => doc.data() as ReceiptEmailSend).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateReceiptSendByProviderId(providerEmailId: string, status: ReceiptEmailSend["status"], error: string | null) {
  const snap = await db().collection(SENDS).where("providerEmailId", "==", providerEmailId).limit(1).get();
  if (snap.empty) return false;
  await snap.docs[0].ref.set({ status, error, updatedAt: new Date().toISOString() }, { merge: true });
  return true;
}

export async function consumeReceiptEmailRateLimit(userId: string) {
  const ref = db().collection(LIMITS).doc(userId);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maximum = 10;
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const value = snap.data() ?? {};
    const windowStartedAt = Number(value.windowStartedAt ?? 0);
    const inWindow = now - windowStartedAt < windowMs;
    const count = inWindow ? Number(value.count ?? 0) : 0;
    if (count >= maximum) throw new Error("RATE_LIMITED");
    tx.set(ref, { userId, windowStartedAt: inWindow ? windowStartedAt : now, count: count + 1, updatedAt: new Date(now).toISOString() });
  });
}

export async function logReceiptEmailAudit(value: Record<string, unknown>) {
  await db().collection(AUDIT).add({ ...value, createdAt: new Date().toISOString() });
}

export async function getReceiptEmailAdminSummary() {
  const database = db();
  const [templates, sends] = await Promise.all([
    database.collection(TEMPLATES).get(),
    database.collection(SENDS).limit(1000).get(),
  ]);
  const values = sends.docs.map((doc) => doc.data() as ReceiptEmailSend).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    totalTemplates: templates.size,
    totalSends: values.length,
    delivered: values.filter((item) => item.status === "delivered").length,
    failures: values.filter((item) => ["failed", "bounced", "complained", "suppressed"].includes(item.status)).length,
    recent: values.slice(0, 100),
  };
}
