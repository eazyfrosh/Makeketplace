import { adminDb } from "@/lib/licensing/admin-db";
import type { DomainOrder, DomainRecord } from "@/types/domains";
const DOMAINS = "domains"; const ORDERS = "domainOrders";
declare global { var __eazytoolDomains: { domains: Map<string, DomainRecord>; orders: Map<string, DomainOrder> } | undefined; }
function demo() { if (!global.__eazytoolDomains) global.__eazytoolDomains = { domains: new Map(), orders: new Map() }; return global.__eazytoolDomains; }
export async function saveDomain(v: DomainRecord) { if (adminDb) return adminDb.collection(DOMAINS).doc(v.id).set(v, { merge: true }); demo().domains.set(v.id, v); }
export async function getDomain(id: string) { if (adminDb) { const s = await adminDb.collection(DOMAINS).doc(id).get(); return s.exists ? s.data() as DomainRecord : null; } return demo().domains.get(id) ?? null; }
export async function getDomainForUser(domain: string, userId: string) { if (adminDb) { const s = await adminDb.collection(DOMAINS).where("domain", "==", domain).where("userId", "==", userId).limit(1).get(); return s.empty ? null : s.docs[0].data() as DomainRecord; } return [...demo().domains.values()].find((v) => v.domain === domain && v.userId === userId) ?? null; }
export async function listDomainsForUser(userId: string) { if (adminDb) { const s = await adminDb.collection(DOMAINS).where("userId", "==", userId).get(); return s.docs.map((d) => d.data() as DomainRecord); } return [...demo().domains.values()].filter((v) => v.userId === userId); }
export async function listDomains() { if (adminDb) { const s = await adminDb.collection(DOMAINS).get(); return s.docs.map((d) => d.data() as DomainRecord); } return [...demo().domains.values()]; }
export async function saveDomainOrder(v: DomainOrder) { if (adminDb) return adminDb.collection(ORDERS).doc(v.id).set(v, { merge: true }); demo().orders.set(v.id, v); }
export async function getDomainOrder(id: string) { if (adminDb) { const s = await adminDb.collection(ORDERS).doc(id).get(); return s.exists ? s.data() as DomainOrder : null; } return demo().orders.get(id) ?? null; }
export async function getDomainOrderByReference(reference: string) { if (adminDb) { const s = await adminDb.collection(ORDERS).where("paystackReference", "==", reference).limit(1).get(); return s.empty ? null : s.docs[0].data() as DomainOrder; } return [...demo().orders.values()].find((v) => v.paystackReference === reference) ?? null; }
export async function listDomainOrders() { if (adminDb) { const s = await adminDb.collection(ORDERS).get(); return s.docs.map((d) => d.data() as DomainOrder); } return [...demo().orders.values()]; }
