import {
  claimSubscriptionReconciliation,
  commitInitialSubscriptionPayment,
  commitProviderSubscriptionStatus,
  commitRenewalPayment,
  findSubscriptionByProvider,
  findPendingSubscriptionPaymentIntent,
  getPlan,
  getPaymentByReference,
  getSubscriptionForUser,
  getSubscriptionPaymentIntent,
  listPendingDirectIntentsForUser,
} from "@/lib/subscriptions/store";
import { addBillingPeriod, paidPeriodExpiry } from "@/lib/subscriptions/billing-period";
import { verifyPaystackTransaction } from "@/lib/wallet/paystack";
import type { Subscription, SubscriptionPayment } from "@/types/subscriptions";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export class SubscriptionPaymentPendingError extends Error {
  constructor() { super("Paystack has not confirmed this payment yet."); }
}

export async function reconcilePendingSubscriptionForUser(userId: string): Promise<void> {
  if (!PAYSTACK_SECRET_KEY) return;
  const pending = (await listPendingDirectIntentsForUser(userId)).slice(0, 3);
  for (const intent of pending) {
    if (!await claimSubscriptionReconciliation(intent.reference, userId)) continue;
    try {
      await activateSubscription({ userId, reference: intent.reference });
    } catch (error) {
      if (error instanceof SubscriptionPaymentPendingError) continue;
      console.error("[subscriptions] account reconciliation deferred", { reason: error instanceof Error ? error.name : "unknown" });
    }
  }
}

function planCode(value: string | { plan_code?: string } | undefined) {
  return typeof value === "string" ? value : value?.plan_code;
}

function paymentRecord(input: { subscription: Subscription; reference: string; providerTransactionId: string; amountMinor: number; paidAt?: string }): SubscriptionPayment {
  const now = new Date().toISOString();
  return {
    id: `paystack_${input.providerTransactionId}`,
    subscriptionId: input.subscription.id,
    userId: input.subscription.userId,
    planId: input.subscription.planId,
    amountCents: input.amountMinor,
    billingCycle: input.subscription.billingCycle,
    provider: "paystack",
    purpose: "subscription",
    currency: "NGN",
    reference: input.reference,
    providerTransactionId: input.providerTransactionId,
    status: "paid",
    paidAt: input.paidAt ?? now,
    createdAt: now,
    updatedAt: now,
  };
}

export async function activateSubscription({ userId, reference }: { userId: string; reference: string }) {
  if (!PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured.");
  const verified = await verifyPaystackTransaction(reference, PAYSTACK_SECRET_KEY);
  const verifiedEmail = verified.customer?.email?.trim().toLowerCase();
  const directIntent = await getSubscriptionPaymentIntent(reference);
  const intent = directIntent ?? (verifiedEmail && verified.amount && verified.currency === "NGN"
    ? await findPendingSubscriptionPaymentIntent({ email: verifiedEmail, amountMinor: verified.amount, currency: "NGN" })
    : null);
  if (!intent) {
    const existingPayment = await getPaymentByReference(reference);
    if (existingPayment?.userId === userId && existingPayment.status === "paid") {
      const existingSubscription = await getSubscriptionForUser(userId);
      if (!existingSubscription) throw new Error("Subscription payment requires manual review.");
      const existingPlan = existingSubscription ? await getPlan(existingSubscription.planId) : null;
      return { subscription: existingSubscription, plan: existingPlan, verifiedPayment: { amountMinor: existingPayment.amountCents, currency: existingPayment.currency } };
    }
    throw new Error("Subscription payment request not found. Make sure you paid with your EazyTool account email.");
  }
  if (intent.userId !== userId || intent.purpose !== "subscription") throw new Error("Subscription payment request not found. Make sure you paid with your EazyTool account email.");
  if (["pending", "ongoing", "processing"].includes(String(verified.status))) throw new SubscriptionPaymentPendingError();
  const plan = await getPlan(intent.planId);
  if (!plan?.active) throw new Error("That subscription plan is not available.");
  if (intent.status === "paid") {
    const paidPayment = await getPaymentByReference(reference);
    const paidSubscription = await getSubscriptionForUser(userId);
    if (!paidPayment || paidPayment.userId !== userId || paidPayment.status !== "paid" || !paidSubscription) throw new Error("Subscription payment requires manual review.");
    return { subscription: paidSubscription, plan, verifiedPayment: { amountMinor: paidPayment.amountCents, currency: paidPayment.currency } };
  }
  if (intent.status !== "pending") throw new Error("This subscription payment is no longer pending.");

  const expectedPlanCode = intent.billingCycle === "yearly" ? plan.yearlyPlanCode : intent.billingCycle === "monthly" ? plan.monthlyPlanCode : null;
  const metadataPurpose = String(verified.metadata?.purpose ?? "");
  const isPaymentPageCheckout = intent.reference !== reference || intent.source === "admin_recovery";
  if (
    verified.status !== "success" || verified.reference !== reference || verified.amount !== intent.amountMinor || verified.currency !== intent.currency ||
    !verifiedEmail || verifiedEmail !== intent.email.trim().toLowerCase() ||
    (isPaymentPageCheckout && (metadataPurpose && metadataPurpose !== "subscription" ||
      verified.metadata?.userId && verified.metadata.userId !== intent.userId ||
      verified.metadata?.planId && verified.metadata.planId !== intent.planId ||
      verified.metadata?.billingCycle && verified.metadata.billingCycle !== intent.billingCycle)) ||
    (!isPaymentPageCheckout && (metadataPurpose !== "subscription" || verified.metadata?.userId !== intent.userId || verified.metadata?.planId !== intent.planId || verified.metadata?.billingCycle !== intent.billingCycle)) ||
    (planCode(verified.plan) && expectedPlanCode && planCode(verified.plan) !== expectedPlanCode)
  ) throw new Error("Verified Paystack payment details do not match this subscription request.");

  const paidAt = new Date(verified.paid_at ?? Date.now());
  const previous = await getSubscriptionForUser(userId);
  const expiresAt = paidPeriodExpiry(paidAt.toISOString(), previous?.expiresAt, intent.billingCycle);
  const subscription: Subscription = {
    id: previous?.id ?? `sub_${intent.userId}`, userId: intent.userId, email: intent.email, planId: plan.id, planName: plan.name, billingCycle: intent.billingCycle,
    status: "active", startedAt: previous?.startedAt ?? paidAt.toISOString(), nextBillingAt: null, expiresAt,
    usageThisMonth: previous?.planId === plan.id ? previous.usageThisMonth : 0, usageLimit: plan.monthlyUsageLimit,
    paystackCustomerCode: verified.customer?.customer_code ?? previous?.paystackCustomerCode ?? null,
    paystackSubscriptionCode: null,
    paystackEmailToken: null,
    paystackAuthorizationCode: verified.authorization?.authorization_code ?? previous?.paystackAuthorizationCode ?? null,
    createdAt: previous?.createdAt ?? paidAt.toISOString(), updatedAt: new Date().toISOString(),
  };
  const payment = paymentRecord({ subscription, reference, providerTransactionId: String(verified.id ?? reference), amountMinor: intent.amountMinor, paidAt: verified.paid_at });
  await commitInitialSubscriptionPayment({ intentReference: intent.reference, subscription, payment: { ...payment, reference } });
  const [recordedPayment, activeSubscription] = await Promise.all([getPaymentByReference(reference), getSubscriptionForUser(userId)]);
  if (!recordedPayment || recordedPayment.userId !== userId || recordedPayment.status !== "paid" || !activeSubscription) throw new Error("Subscription payment requires manual review.");
  return { subscription: activeSubscription, plan, verifiedPayment: { amountMinor: recordedPayment.amountCents, currency: recordedPayment.currency } };
}

export async function activateSubscriptionFromWebhook(reference: string) {
  if (!PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured.");
  const verified = await verifyPaystackTransaction(reference, PAYSTACK_SECRET_KEY);
  const email = verified.customer?.email?.trim().toLowerCase();
  if (!email || verified.currency !== "NGN" || typeof verified.amount !== "number") return false;
  const intent = await getSubscriptionPaymentIntent(reference) ?? await findPendingSubscriptionPaymentIntent({ email, amountMinor: verified.amount, currency: "NGN" });
  if (!intent) return false;
  await activateSubscription({ userId: intent.userId, reference });
  return true;
}

export async function processSubscriptionRenewal(reference: string, subscriptionCode: string) {
  if (!PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured.");
  const verified = await verifyPaystackTransaction(reference, PAYSTACK_SECRET_KEY);
  if (verified.status !== "success" || verified.reference !== reference || verified.currency !== "NGN") throw new Error("Paystack renewal verification failed.");
  const subscription = await findSubscriptionByProvider({ subscriptionCode });
  if (!subscription) return false;
  if (subscription.paystackSubscriptionCode !== subscriptionCode || verified.subscription_code && verified.subscription_code !== subscriptionCode) throw new Error("Paystack renewal does not match this subscription.");
  const plan = await getPlan(subscription.planId);
  if (!plan) throw new Error("Subscription plan not found.");
  const expectedAmount = subscription.billingCycle === "yearly" ? plan.yearlyPriceCents : subscription.billingCycle === "six_months" ? plan.sixMonthPriceCents : plan.monthlyPriceCents;
  const expectedPlanCode = subscription.billingCycle === "yearly" ? plan.yearlyPlanCode : subscription.billingCycle === "monthly" ? plan.monthlyPlanCode : null;
  if (verified.amount !== expectedAmount || (planCode(verified.plan) && expectedPlanCode && planCode(verified.plan) !== expectedPlanCode)) throw new Error("Verified renewal details do not match the subscription.");
  const paidAt = new Date(verified.paid_at ?? Date.now());
  const nextBilling = addBillingPeriod(paidAt, subscription.billingCycle);
  const updated: Subscription = { ...subscription, status: "active", nextBillingAt: nextBilling.toISOString(), expiresAt: nextBilling.toISOString(), updatedAt: new Date().toISOString() };
  const payment = paymentRecord({ subscription: updated, reference, providerTransactionId: String(verified.id ?? reference), amountMinor: expectedAmount, paidAt: verified.paid_at });
  return commitRenewalPayment({ subscription: updated, payment });
}

export async function updateSubscriptionFromProvider(input: { email?: string; customerCode?: string; subscriptionCode?: string; status: Subscription["status"]; nextBillingAt?: string | null; emailToken?: string | null }) {
  if (!input.subscriptionCode) return false;
  const subscription = await findSubscriptionByProvider({ subscriptionCode: input.subscriptionCode });
  if (!subscription) return false;
  return commitProviderSubscriptionStatus({ subscriptionId: subscription.id, subscriptionCode: input.subscriptionCode, status: input.status, customerCode: input.customerCode ?? null, emailToken: input.emailToken ?? null, nextBillingAt: input.nextBillingAt ?? null });
}
