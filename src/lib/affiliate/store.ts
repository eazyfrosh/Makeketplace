// Mirrors src/lib/banking/store.ts's exact Admin-SDK-or-in-memory pattern.
import { adminDb } from "@/lib/licensing/admin-db";
import type { Affiliate, AffiliateCommission, AffiliatePayoutRequest, AffiliateReferral } from "@/lib/affiliate/types";

const AFFILIATES = "affiliates";
const REFERRALS = "affiliateReferrals";
const COMMISSIONS = "affiliateCommissions";
const PAYOUT_REQUESTS = "affiliatePayoutRequests";

declare global {
  var __nexovaAffiliateDemoStore:
    | {
        affiliates: Map<string, Affiliate>;
        referrals: Map<string, AffiliateReferral>;
        commissions: Map<string, AffiliateCommission>;
        payoutRequests: Map<string, AffiliatePayoutRequest>;
      }
    | undefined;
}

function demoStore() {
  if (!global.__nexovaAffiliateDemoStore) {
    global.__nexovaAffiliateDemoStore = {
      affiliates: new Map(),
      referrals: new Map(),
      commissions: new Map(),
      payoutRequests: new Map(),
    };
  }
  return global.__nexovaAffiliateDemoStore;
}

export async function getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
  if (adminDb) {
    const snap = await adminDb.collection(AFFILIATES).where("userId", "==", userId).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as Affiliate);
  }
  return Array.from(demoStore().affiliates.values()).find((a) => a.userId === userId) ?? null;
}

export async function getAffiliateById(id: string): Promise<Affiliate | null> {
  if (adminDb) {
    const snap = await adminDb.collection(AFFILIATES).doc(id).get();
    return snap.exists ? (snap.data() as Affiliate) : null;
  }
  return demoStore().affiliates.get(id) ?? null;
}

export async function getAffiliateByCode(code: string): Promise<Affiliate | null> {
  if (adminDb) {
    const snap = await adminDb.collection(AFFILIATES).where("code", "==", code).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as Affiliate);
  }
  return Array.from(demoStore().affiliates.values()).find((a) => a.code === code) ?? null;
}

export async function createAffiliate(affiliate: Affiliate): Promise<void> {
  if (adminDb) {
    await adminDb.collection(AFFILIATES).doc(affiliate.id).set(affiliate);
    return;
  }
  demoStore().affiliates.set(affiliate.id, affiliate);
}

export async function updateAffiliate(affiliate: Affiliate): Promise<void> {
  if (adminDb) {
    await adminDb.collection(AFFILIATES).doc(affiliate.id).set(affiliate);
    return;
  }
  demoStore().affiliates.set(affiliate.id, affiliate);
}

export async function getAllAffiliates(): Promise<Affiliate[]> {
  if (adminDb) {
    const snap = await adminDb.collection(AFFILIATES).get();
    return snap.docs.map((d) => d.data() as Affiliate);
  }
  return Array.from(demoStore().affiliates.values());
}

export async function getReferralForUser(referredUserId: string): Promise<AffiliateReferral | null> {
  if (adminDb) {
    const snap = await adminDb.collection(REFERRALS).where("referredUserId", "==", referredUserId).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as AffiliateReferral);
  }
  return Array.from(demoStore().referrals.values()).find((r) => r.referredUserId === referredUserId) ?? null;
}

export async function createReferral(referral: AffiliateReferral): Promise<void> {
  if (adminDb) {
    await adminDb.collection(REFERRALS).doc(referral.id).set(referral);
    return;
  }
  demoStore().referrals.set(referral.id, referral);
}

export async function getReferralsForAffiliate(affiliateId: string): Promise<AffiliateReferral[]> {
  if (adminDb) {
    const snap = await adminDb.collection(REFERRALS).where("affiliateId", "==", affiliateId).get();
    return snap.docs.map((d) => d.data() as AffiliateReferral);
  }
  return Array.from(demoStore().referrals.values()).filter((r) => r.affiliateId === affiliateId);
}

export async function createCommission(commission: AffiliateCommission): Promise<void> {
  if (adminDb) {
    await adminDb.collection(COMMISSIONS).doc(commission.id).set(commission);
    return;
  }
  demoStore().commissions.set(commission.id, commission);
}

export async function updateCommission(commission: AffiliateCommission): Promise<void> {
  if (adminDb) {
    await adminDb.collection(COMMISSIONS).doc(commission.id).set(commission);
    return;
  }
  demoStore().commissions.set(commission.id, commission);
}

export async function getCommissionsForAffiliate(affiliateId: string): Promise<AffiliateCommission[]> {
  if (adminDb) {
    const snap = await adminDb.collection(COMMISSIONS).where("affiliateId", "==", affiliateId).get();
    return snap.docs.map((d) => d.data() as AffiliateCommission);
  }
  return Array.from(demoStore().commissions.values()).filter((c) => c.affiliateId === affiliateId);
}

export async function createPayoutRequest(request: AffiliatePayoutRequest): Promise<void> {
  if (adminDb) {
    await adminDb.collection(PAYOUT_REQUESTS).doc(request.id).set(request);
    return;
  }
  demoStore().payoutRequests.set(request.id, request);
}

export async function updatePayoutRequest(request: AffiliatePayoutRequest): Promise<void> {
  if (adminDb) {
    await adminDb.collection(PAYOUT_REQUESTS).doc(request.id).set(request);
    return;
  }
  demoStore().payoutRequests.set(request.id, request);
}

export async function getPayoutRequestById(id: string): Promise<AffiliatePayoutRequest | null> {
  if (adminDb) {
    const snap = await adminDb.collection(PAYOUT_REQUESTS).doc(id).get();
    return snap.exists ? (snap.data() as AffiliatePayoutRequest) : null;
  }
  return demoStore().payoutRequests.get(id) ?? null;
}

export async function getPayoutRequestsForAffiliate(affiliateId: string): Promise<AffiliatePayoutRequest[]> {
  if (adminDb) {
    const snap = await adminDb.collection(PAYOUT_REQUESTS).where("affiliateId", "==", affiliateId).get();
    return snap.docs.map((d) => d.data() as AffiliatePayoutRequest);
  }
  return Array.from(demoStore().payoutRequests.values()).filter((r) => r.affiliateId === affiliateId);
}

export async function getAllPayoutRequests(): Promise<AffiliatePayoutRequest[]> {
  if (adminDb) {
    const snap = await adminDb.collection(PAYOUT_REQUESTS).get();
    return snap.docs.map((d) => d.data() as AffiliatePayoutRequest);
  }
  return Array.from(demoStore().payoutRequests.values());
}
