import { generateId } from "@/lib/licensing/keys";
import {
  commitInitialSubscriptionPayment,
  commitRenewalPayment,
  findSubscriptionByProvider,
  getPlan,
  getSubscriptionForUser,
  getSubscriptionPaymentIntent,
  saveSubscription,
} from "@/lib/subscriptions/store";
import { verifyPaystackTransaction } from "@/lib/wallet/paystack";
import type { Subscription, SubscriptionBillingCycle, SubscriptionPayment } from "@/types/subscriptions";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export function addBillingPeriod(date: Date, cycle: SubscriptionBillingCycle) {
  const next = new Date(date);
  if (cycle === "yearly") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
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
  const intent = await getSubscriptionPaymentIntent(reference);
  if (!intent || intent.userId !== userId || intent.purpose !== "subscription") throw new Error("Subscription payment request not found.");
  const plan = await getPlan(intent.planId);
  if (!plan?.active) throw new Error("That subscription plan is not available.");
  if (intent.status === "paid") return { subscription: await getSubscriptionForUser(userId), plan };
  if (intent.status !== "pending") throw new Error("This subscription payment is no longer pending.");

  const verified = await verifyPaystackTransaction(reference, PAYSTACK_SECRET_KEY);
  const expectedPlanCode = intent.billingCycle === "yearly" ? plan.yearlyPlanCode : plan.monthlyPlanCode;
  if (
    verified.status !== "success" || verified.reference !== intent.reference || verified.amount !== intent.amountMinor || verified.currency !== intent.currency ||
    verified.metadata?.purpose !== "subscription" || verified.metadata?.userId !== intent.userId || verified.metadata?.planId !== intent.planId ||
    verified.metadata?.billingCycle !== intent.billingCycle || (planCode(verified.plan) && expectedPlanCode && planCode(verified.plan) !== expectedPlanCode)
  ) throw new Error("Verified Paystack payment details do not match this subscription request.");

  const paidAt = new Date(verified.paid_at ?? Date.now());
  const nextBilling = addBillingPeriod(paidAt, intent.billingCycle);
  const previous = await getSubscriptionForUser(userId);
  const subscription: Subscription = {
    id: previous?.id ?? generateId("sub"), userId: intent.userId, email: intent.email, planId: plan.id, planName: plan.name, billingCycle: intent.billingCycle,
    status: "active", startedAt: previous?.startedAt ?? paidAt.toISOString(), nextBillingAt: nextBilling.toISOString(), expiresAt: nextBilling.toISOString(),
    usageThisMonth: previous?.planId === plan.id ? previous.usageThisMonth : 0, usageLimit: plan.monthlyUsageLimit,
    paystackCustomerCode: verified.customer?.customer_code ?? previous?.paystackCustomerCode ?? null,
    paystackSubscriptionCode: verified.subscription_code ?? previous?.paystackSubscriptionCode ?? null,
    paystackEmailToken: verified.email_token ?? previous?.paystackEmailToken ?? null,
    paystackAuthorizationCode: verified.authorization?.authorization_code ?? previous?.paystackAuthorizationCode ?? null,
    createdAt: previous?.createdAt ?? paidAt.toISOString(), updatedAt: new Date().toISOString(),
  };
  const payment = paymentRecord({ subscription, reference, providerTransactionId: String(verified.id ?? reference), amountMinor: intent.amountMinor, paidAt: verified.paid_at });
  await commitInitialSubscriptionPayment({ intentReference: intent.reference, subscription, payment });
  return { subscription: await getSubscriptionForUser(userId), plan };
}

export async function processSubscriptionRenewal(reference: string) {
  if (!PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured.");
  const verified = await verifyPaystackTransaction(reference, PAYSTACK_SECRET_KEY);
  if (verified.status !== "success" || verified.reference !== reference || verified.currency !== "NGN") throw new Error("Paystack renewal verification failed.");
  const subscription = await findSubscriptionByProvider({ email: verified.customer?.email, customerCode: verified.customer?.customer_code, subscriptionCode: verified.subscription_code });
  if (!subscription) return false;
  const plan = await getPlan(subscription.planId);
  if (!plan) throw new Error("Subscription plan not found.");
  const expectedAmount = subscription.billingCycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
  const expectedPlanCode = subscription.billingCycle === "yearly" ? plan.yearlyPlanCode : plan.monthlyPlanCode;
  if (verified.amount !== expectedAmount || (planCode(verified.plan) && expectedPlanCode && planCode(verified.plan) !== expectedPlanCode)) throw new Error("Verified renewal details do not match the subscription.");
  const paidAt = new Date(verified.paid_at ?? Date.now());
  const nextBilling = addBillingPeriod(paidAt, subscription.billingCycle);
  const updated: Subscription = { ...subscription, status: "active", nextBillingAt: nextBilling.toISOString(), expiresAt: nextBilling.toISOString(), updatedAt: new Date().toISOString() };
  const payment = paymentRecord({ subscription: updated, reference, providerTransactionId: String(verified.id ?? reference), amountMinor: expectedAmount, paidAt: verified.paid_at });
  return commitRenewalPayment({ subscription: updated, payment });
}

export async function updateSubscriptionFromProvider(input: { email?: string; customerCode?: string; subscriptionCode?: string; status: Subscription["status"]; nextBillingAt?: string | null; emailToken?: string | null }) {
  const subscription = await findSubscriptionByProvider(input);
  if (!subscription) return false;
  await saveSubscription({ ...subscription, status: input.status, paystackSubscriptionCode: input.subscriptionCode ?? subscription.paystackSubscriptionCode, paystackCustomerCode: input.customerCode ?? subscription.paystackCustomerCode, paystackEmailToken: input.emailToken ?? subscription.paystackEmailToken, nextBillingAt: input.nextBillingAt ?? subscription.nextBillingAt, updatedAt: new Date().toISOString() });
  return true;
}
