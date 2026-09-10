import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/lib/subscriptions/plans";
import type { Subscription, SubscriptionPayment, SubscriptionPlan } from "@/types/subscriptions";

export const isSubscriptionBackendDurable = isAdminDbConfigured;
const PLANS = "subscriptionPlans";
const SUBSCRIPTIONS = "subscriptions";
const PAYMENTS = "subscriptionPayments";

declare global {
  var __eazytoolsSubscriptions:
    | { plans: Map<string, SubscriptionPlan>; subscriptions: Map<string, Subscription>; payments: Map<string, SubscriptionPayment> }
    | undefined;
}

function demoStore() {
  if (!global.__eazytoolsSubscriptions) {
    global.__eazytoolsSubscriptions = {
      plans: new Map(DEFAULT_SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan])),
      subscriptions: new Map(),
      payments: new Map(),
    };
  }
  return global.__eazytoolsSubscriptions;
}

export async function listPlans(): Promise<SubscriptionPlan[]> {
  const db = adminDb;
  if (db) {
    const snap = await db.collection(PLANS).where("active", "==", true).get();
    if (!snap.empty) return snap.docs.map((doc) => doc.data() as SubscriptionPlan);
    await Promise.all(DEFAULT_SUBSCRIPTION_PLANS.map((plan) => db.collection(PLANS).doc(plan.id).set(plan, { merge: true })));
  }
  return adminDb ? DEFAULT_SUBSCRIPTION_PLANS : Array.from(demoStore().plans.values()).filter((plan) => plan.active);
}

export async function getPlan(id: string): Promise<SubscriptionPlan | null> {
  if (adminDb) {
    const snap = await adminDb.collection(PLANS).doc(id).get();
    if (snap.exists) return snap.data() as SubscriptionPlan;
  }
  return demoStore().plans.get(id) ?? null;
}

export async function savePlan(plan: SubscriptionPlan): Promise<void> {
  if (adminDb) {
    await adminDb.collection(PLANS).doc(plan.id).set(plan, { merge: true });
    return;
  }
  demoStore().plans.set(plan.id, plan);
}

export async function getSubscriptionForUser(userId: string): Promise<Subscription | null> {
  if (adminDb) {
    const snap = await adminDb.collection(SUBSCRIPTIONS).where("userId", "==", userId).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as Subscription);
  }
  return Array.from(demoStore().subscriptions.values()).find((item) => item.userId === userId) ?? null;
}

export async function saveSubscription(subscription: Subscription): Promise<void> {
  if (adminDb) {
    await adminDb.collection(SUBSCRIPTIONS).doc(subscription.id).set(subscription, { merge: true });
    return;
  }
  demoStore().subscriptions.set(subscription.id, subscription);
}

export async function listSubscriptions(): Promise<Subscription[]> {
  if (adminDb) {
    const snap = await adminDb.collection(SUBSCRIPTIONS).get();
    return snap.docs.map((doc) => doc.data() as Subscription);
  }
  return Array.from(demoStore().subscriptions.values());
}

export async function listPaymentsForUser(userId: string): Promise<SubscriptionPayment[]> {
  if (adminDb) {
    const snap = await adminDb.collection(PAYMENTS).where("userId", "==", userId).get();
    return snap.docs.map((doc) => doc.data() as SubscriptionPayment);
  }
  return Array.from(demoStore().payments.values()).filter((item) => item.userId === userId);
}

export async function savePayment(payment: SubscriptionPayment): Promise<void> {
  if (adminDb) {
    await adminDb.collection(PAYMENTS).doc(payment.id).set(payment, { merge: true });
    return;
  }
  demoStore().payments.set(payment.id, payment);
}

export async function getPaymentByReference(reference: string): Promise<SubscriptionPayment | null> {
  if (adminDb) {
    const snap = await adminDb.collection(PAYMENTS).where("reference", "==", reference).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as SubscriptionPayment);
  }
  return Array.from(demoStore().payments.values()).find((item) => item.reference === reference) ?? null;
}
