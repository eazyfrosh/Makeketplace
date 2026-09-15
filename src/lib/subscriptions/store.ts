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
  return DEFAULT_SUBSCRIPTION_PLANS;
}

export async function getPlan(id: string): Promise<SubscriptionPlan | null> {
  const defaultPlan = DEFAULT_SUBSCRIPTION_PLANS[0];
  // Existing subscribers on the retired Starter, Pro, or Business plans are
  // grandfathered into All Access so the pricing migration does not lock them out.
  if (["all-access", "starter", "pro", "business"].includes(id)) return defaultPlan;
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
    // A customer can have historical subscription records after retrying or
    // renewing checkout. Firestore does not guarantee which document a
    // `limit(1)` query returns, so an old cancelled record could hide the new
    // active subscription and send a paid customer back to pricing.
    const snap = await adminDb.collection(SUBSCRIPTIONS).where("userId", "==", userId).get();
    return selectCurrentSubscription(snap.docs.map((doc) => doc.data() as Subscription));
  }
  return selectCurrentSubscription(
    Array.from(demoStore().subscriptions.values()).filter((item) => item.userId === userId),
  );
}

function selectCurrentSubscription(subscriptions: Subscription[]): Subscription | null {
  const now = Date.now();
  const isUsable = (subscription: Subscription) =>
    String(subscription.status).toLowerCase() === "active" &&
    (!subscription.expiresAt || new Date(subscription.expiresAt).getTime() >= now);
  const timestamp = (subscription: Subscription) => {
    const value = Date.parse(subscription.updatedAt || subscription.createdAt || subscription.startedAt);
    return Number.isFinite(value) ? value : 0;
  };

  return [...subscriptions].sort((a, b) => {
    const usableDifference = Number(isUsable(b)) - Number(isUsable(a));
    return usableDifference || timestamp(b) - timestamp(a);
  })[0] ?? null;
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
