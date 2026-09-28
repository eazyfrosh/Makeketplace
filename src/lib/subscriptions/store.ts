import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/lib/subscriptions/plans";
import type { Subscription, SubscriptionPayment, SubscriptionPaymentIntent, SubscriptionPlan } from "@/types/subscriptions";

export const isSubscriptionBackendDurable = isAdminDbConfigured;
const PLANS = "subscriptionPlans";
const SUBSCRIPTIONS = "subscriptions";
const PAYMENTS = "subscriptionPayments";
const PAYMENT_INTENTS = "subscriptionPaymentIntents";
const PROVIDER_EVENTS = "paystackProviderEvents";

declare global {
  var __eazytoolsSubscriptions:
    | { plans: Map<string, SubscriptionPlan>; subscriptions: Map<string, Subscription>; payments: Map<string, SubscriptionPayment>; intents: Map<string, SubscriptionPaymentIntent>; providerEvents: Set<string> }
    | undefined;
}

function demoStore() {
  if (!global.__eazytoolsSubscriptions) {
    global.__eazytoolsSubscriptions = {
      plans: new Map(DEFAULT_SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan])),
      subscriptions: new Map(),
      payments: new Map(),
      intents: new Map(),
      providerEvents: new Set(),
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
    ["active", "non_renewing"].includes(String(subscription.status).toLowerCase()) &&
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

export async function createSubscriptionPaymentIntent(intent: SubscriptionPaymentIntent): Promise<void> {
  if (adminDb) {
    const ref = adminDb.collection(PAYMENT_INTENTS).doc(intent.id);
    await adminDb.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (existing.exists) throw new Error("A subscription payment with this reference already exists.");
      tx.create(ref, intent);
    });
    return;
  }
  if (demoStore().intents.has(intent.id)) throw new Error("A subscription payment with this reference already exists.");
  demoStore().intents.set(intent.id, intent);
}

export async function getSubscriptionPaymentIntent(reference: string): Promise<SubscriptionPaymentIntent | null> {
  if (adminDb) {
    const snap = await adminDb.collection(PAYMENT_INTENTS).doc(reference).get();
    return snap.exists ? snap.data() as SubscriptionPaymentIntent : null;
  }
  return demoStore().intents.get(reference) ?? null;
}

export async function failSubscriptionPaymentIntent(reference: string): Promise<void> {
  const now = new Date().toISOString();
  if (adminDb) {
    const ref = adminDb.collection(PAYMENT_INTENTS).doc(reference);
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists && snap.data()?.status === "pending") tx.update(ref, { status: "failed", updatedAt: now });
    });
    return;
  }
  const intent = demoStore().intents.get(reference);
  if (intent?.status === "pending") demoStore().intents.set(reference, { ...intent, status: "failed", updatedAt: now });
}

export async function commitInitialSubscriptionPayment(input: { intentReference: string; subscription: Subscription; payment: SubscriptionPayment }): Promise<boolean> {
  if (adminDb) {
    const intentRef = adminDb.collection(PAYMENT_INTENTS).doc(input.intentReference);
    const paymentRef = adminDb.collection(PAYMENTS).doc(input.payment.id);
    const subscriptionRef = adminDb.collection(SUBSCRIPTIONS).doc(input.subscription.id);
    return adminDb.runTransaction(async (tx) => {
      const [intentSnap, paymentSnap] = await Promise.all([tx.get(intentRef), tx.get(paymentRef)]);
      if (!intentSnap.exists) throw new Error("Subscription payment intent not found.");
      if (paymentSnap.exists || intentSnap.data()?.status === "paid") return false;
      if (intentSnap.data()?.status !== "pending") throw new Error("Subscription payment is no longer pending.");
      tx.set(subscriptionRef, input.subscription, { merge: true });
      tx.create(paymentRef, input.payment);
      tx.update(intentRef, { status: "paid", providerTransactionId: input.payment.providerTransactionId, updatedAt: input.payment.updatedAt });
      return true;
    });
  }
  const intent = demoStore().intents.get(input.intentReference);
  if (!intent) throw new Error("Subscription payment intent not found.");
  if (demoStore().payments.has(input.payment.id) || intent.status === "paid") return false;
  demoStore().subscriptions.set(input.subscription.id, input.subscription);
  demoStore().payments.set(input.payment.id, input.payment);
  demoStore().intents.set(intent.id, { ...intent, status: "paid", providerTransactionId: input.payment.providerTransactionId, updatedAt: input.payment.updatedAt });
  return true;
}

export async function commitRenewalPayment(input: { subscription: Subscription; payment: SubscriptionPayment }): Promise<boolean> {
  if (adminDb) {
    const paymentRef = adminDb.collection(PAYMENTS).doc(input.payment.id);
    const subscriptionRef = adminDb.collection(SUBSCRIPTIONS).doc(input.subscription.id);
    return adminDb.runTransaction(async (tx) => {
      const paymentSnap = await tx.get(paymentRef);
      if (paymentSnap.exists) return false;
      tx.set(subscriptionRef, input.subscription, { merge: true });
      tx.create(paymentRef, input.payment);
      return true;
    });
  }
  if (demoStore().payments.has(input.payment.id)) return false;
  demoStore().subscriptions.set(input.subscription.id, input.subscription);
  demoStore().payments.set(input.payment.id, input.payment);
  return true;
}

export async function findSubscriptionByProvider(input: { email?: string; customerCode?: string; subscriptionCode?: string }): Promise<Subscription | null> {
  const subscriptions = await listSubscriptions();
  return subscriptions.find((item) =>
    Boolean(input.subscriptionCode && item.paystackSubscriptionCode === input.subscriptionCode) ||
    Boolean(input.customerCode && item.paystackCustomerCode === input.customerCode) ||
    Boolean(input.email && item.email.toLowerCase() === input.email.toLowerCase()),
  ) ?? null;
}

export async function hasPaystackProviderEvent(eventId: string): Promise<boolean> {
  if (adminDb) return (await adminDb.collection(PROVIDER_EVENTS).doc(eventId).get()).exists;
  return demoStore().providerEvents.has(eventId);
}

export async function recordPaystackProviderEvent(eventId: string, eventName: string, reference: string | null): Promise<void> {
  if (adminDb) {
    await adminDb.collection(PROVIDER_EVENTS).doc(eventId).create({ id: eventId, provider: "paystack", eventName, reference, processedAt: new Date().toISOString() }).catch((error: unknown) => {
      if ((error as { code?: number | string })?.code !== 6 && (error as { code?: number | string })?.code !== "already-exists") throw error;
    });
    return;
  }
  demoStore().providerEvents.add(eventId);
}

export async function markSubscriptionPaymentRefunded(reference: string): Promise<void> {
  const payment = await getPaymentByReference(reference);
  if (!payment || payment.status === "refunded") return;
  const now = new Date().toISOString();
  if (adminDb) {
    const database = adminDb;
    await database.runTransaction(async (tx) => {
      const paymentRef = database.collection(PAYMENTS).doc(payment.id);
      const subscriptionRef = database.collection(SUBSCRIPTIONS).doc(payment.subscriptionId);
      const paymentSnap = await tx.get(paymentRef);
      if (!paymentSnap.exists || paymentSnap.data()?.status === "refunded") return;
      tx.update(paymentRef, { status: "refunded", updatedAt: now });
      tx.set(subscriptionRef, { status: "cancelled", updatedAt: now }, { merge: true });
    });
    return;
  }
  demoStore().payments.set(payment.id, { ...payment, status: "refunded", updatedAt: now });
  const subscription = demoStore().subscriptions.get(payment.subscriptionId);
  if (subscription) demoStore().subscriptions.set(subscription.id, { ...subscription, status: "cancelled", updatedAt: now });
}
