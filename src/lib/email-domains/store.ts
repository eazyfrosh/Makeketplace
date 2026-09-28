import "server-only";

import { adminDb } from "@/lib/licensing/admin-db";
import type { EmailDomainRecord, SenderIdentity } from "@/lib/email-domains/types";

const DOMAINS = "emailDomains";
const SENDERS = "emailSenderIdentities";
const EVENTS = "emailProviderEvents";
const SUPPRESSIONS = "emailSuppressions";
const AUDIT = "emailDomainAuditLogs";

function db() { if (!adminDb) throw new Error("Email-domain storage is unavailable. Configure Firebase Admin credentials."); return adminDb; }
export async function getEmailDomain(id: string) { const snap = await db().collection(DOMAINS).doc(id).get(); return snap.exists ? snap.data() as EmailDomainRecord : null; }
export async function getEmailDomainForUser(id: string, userId: string) { const value = await getEmailDomain(id); return value?.userId === userId ? value : null; }
export async function getEmailDomainByDomainId(domainId: string) { const snap = await db().collection(DOMAINS).where("domainId", "==", domainId).limit(1).get(); return snap.empty ? null : snap.docs[0].data() as EmailDomainRecord; }
export async function saveEmailDomain(value: EmailDomainRecord) { await db().collection(DOMAINS).doc(value.id).set(value, { merge: true }); return value; }
export async function listEmailDomainsForUser(userId: string) { const snap = await db().collection(DOMAINS).where("userId", "==", userId).get(); return snap.docs.map((doc) => doc.data() as EmailDomainRecord); }
export async function listEmailDomains() { const snap = await db().collection(DOMAINS).limit(500).get(); return snap.docs.map((doc) => doc.data() as EmailDomainRecord); }
export async function getSenderIdentity(id: string) { const snap = await db().collection(SENDERS).doc(id).get(); return snap.exists ? snap.data() as SenderIdentity : null; }
export async function listSenderIdentities(userId: string) { const snap = await db().collection(SENDERS).where("userId", "==", userId).get(); return snap.docs.map((doc) => doc.data() as SenderIdentity).filter((item) => item.enabled); }
export async function listAllSenderIdentities() { const snap = await db().collection(SENDERS).limit(1000).get(); return snap.docs.map((doc) => doc.data() as SenderIdentity); }
export async function createSenderIdentity(value: SenderIdentity) { const database = db(); await database.runTransaction(async (tx) => { const domainRef = database.collection(DOMAINS).doc(value.emailDomainId); const defaultQuery = database.collection(SENDERS).where("userId", "==", value.userId).where("isDefault", "==", true); const [domainSnap, existing] = await Promise.all([tx.get(domainRef), value.isDefault ? tx.get(defaultQuery) : Promise.resolve(null)]); const emailDomain = domainSnap.data() as EmailDomainRecord | undefined; if (!domainSnap.exists || emailDomain?.userId !== value.userId || emailDomain.status !== "ready" || emailDomain.suspended) throw new Error("EMAIL_DOMAIN_NOT_READY"); existing?.docs.forEach((doc) => tx.update(doc.ref, { isDefault: false, updatedAt: value.updatedAt })); tx.create(database.collection(SENDERS).doc(value.id), value); }); return value; }
export async function isRecipientSuppressed(userId: string, recipient: string) { return (await db().collection(SUPPRESSIONS).doc(`${userId}_${recipient.toLowerCase()}`).get()).exists; }
export async function suppressRecipient(userId: string, recipient: string, reason: string) { await db().collection(SUPPRESSIONS).doc(`${userId}_${recipient.toLowerCase()}`).set({ userId, recipient: recipient.toLowerCase(), reason, createdAt: new Date().toISOString() }, { merge: true }); }
export async function claimProviderEvent(eventId: string, type: string) { const ref = db().collection(EVENTS).doc(eventId); try { await ref.create({ eventId, type, createdAt: new Date().toISOString() }); return true; } catch (error) { if ((error as { code?: number }).code === 6 || String(error).includes("ALREADY_EXISTS")) return false; throw error; } }
export async function releaseProviderEvent(eventId: string) { await db().collection(EVENTS).doc(eventId).delete().catch(() => undefined); }
export async function consumeEmailDomainSendQuota(emailDomainId: string, userId: string) {
  const database = db(); const ref = database.collection(DOMAINS).doc(emailDomainId); const maximum = Number(process.env.EMAIL_DOMAIN_HOURLY_LIMIT ?? 50); const now = Date.now();
  await database.runTransaction(async (tx) => { const snap = await tx.get(ref); const value = snap.data() as EmailDomainRecord | undefined; if (!value || value.userId !== userId || value.status !== "ready" || value.suspended) throw new Error("EMAIL_DOMAIN_NOT_READY"); const windowStartedAt = Number((value as unknown as Record<string, unknown>).sendWindowStartedAt ?? 0); const inWindow = now - windowStartedAt < 3_600_000; const count = inWindow ? Number((value as unknown as Record<string, unknown>).sendWindowCount ?? 0) : 0; if (count >= maximum) throw new Error("DOMAIN_RATE_LIMITED"); tx.update(ref, { sendWindowStartedAt: inWindow ? windowStartedAt : now, sendWindowCount: count + 1, sentCount: Number(value.sentCount ?? 0) + 1, updatedAt: new Date(now).toISOString() }); });
}
export async function recordEmailDomainDelivery(emailDomainId: string, status: "delivered" | "bounced" | "complained" | "failed") {
  const database = db(); const ref = database.collection(DOMAINS).doc(emailDomainId);
  await database.runTransaction(async (tx) => { const snap = await tx.get(ref); if (!snap.exists) return; const value = snap.data() as EmailDomainRecord; const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }; if (status === "delivered") update.deliveredCount = Number(value.deliveredCount ?? 0) + 1; if (status === "bounced") update.bouncedCount = Number(value.bouncedCount ?? 0) + 1; if (status === "complained") update.complaintCount = Number(value.complaintCount ?? 0) + 1; const projectedBounces = Number(update.bouncedCount ?? value.bouncedCount ?? 0); const projectedComplaints = Number(update.complaintCount ?? value.complaintCount ?? 0); const sent = Math.max(Number(value.sentCount ?? 0), 1); if ((sent >= 20 && projectedBounces / sent > 0.1) || projectedComplaints >= 2) { update.suspended = true; update.suspensionReason = "Sending automatically suspended because of excessive bounces or spam complaints."; } tx.update(ref, update); });
}
export async function logEmailDomainAudit(value: Record<string, unknown>) { await db().collection(AUDIT).add({ ...value, createdAt: new Date().toISOString() }); }
export async function setEmailDomainSuspension(id: string, suspended: boolean, reason: string, actorId: string) { const ref = db().collection(DOMAINS).doc(id); await db().runTransaction(async (tx) => { const snap = await tx.get(ref); if (!snap.exists) throw new Error("Domain not found."); const before = snap.data()?.suspended === true; tx.update(ref, { suspended, suspensionReason: suspended ? reason : null, updatedAt: new Date().toISOString() }); tx.create(db().collection(AUDIT).doc(), { actorId, action: suspended ? "email_domain.suspended" : "email_domain.restored", targetId: id, before, after: suspended, reason, createdAt: new Date().toISOString() }); }); }
