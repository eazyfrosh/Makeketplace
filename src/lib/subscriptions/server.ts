import { generateId } from "@/lib/licensing/keys";
import { getPaymentByReference, getPlan, getSubscriptionForUser, savePayment, saveSubscription } from "@/lib/subscriptions/store";
import type { Subscription, SubscriptionBillingCycle, SubscriptionPayment } from "@/types/subscriptions";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export function addBillingPeriod(date: Date, cycle: SubscriptionBillingCycle) {
  const next = new Date(date);
  if (cycle === "yearly") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

async function verifyPaystack(reference: string) {
  if (!PAYSTACK_SECRET_KEY) return { ok: true, data: { status: "success", amount: 0, customer: {}, plan: null, authorization: null } };
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  if (!response.ok) return { ok: false, data: null };
  const payload = await response.json();
  return { ok: payload?.data?.status === "success", data: payload?.data ?? null };
}

export async function activateSubscription({ userId, email, planId, billingCycle, reference }: {
  userId: string;
  email: string;
  planId: string;
  billingCycle: SubscriptionBillingCycle;
  reference: string;
}) {
  const plan = await getPlan(planId);
  if (!plan || !plan.active) throw new Error("That subscription plan is not available.");
  const existingPayment = await getPaymentByReference(reference);
  if (existingPayment) {
    const subscription = await getSubscriptionForUser(userId);
    return { subscription, plan };
  }

  const verification = await verifyPaystack(reference);
  const expectedAmount = billingCycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
  if (!verification.ok) throw new Error("Paystack could not verify this payment.");
  if (PAYSTACK_SECRET_KEY && Number(verification.data?.amount) !== expectedAmount) {
    throw new Error("The verified Paystack amount does not match this plan.");
  }

  const now = new Date();
  const nextBilling = addBillingPeriod(now, billingCycle);
  const previous = await getSubscriptionForUser(userId);
  const subscription: Subscription = {
    id: previous?.id ?? generateId("sub"),
    userId,
    email,
    planId: plan.id,
    planName: plan.name,
    billingCycle,
    status: "active",
    startedAt: previous?.startedAt ?? now.toISOString(),
    nextBillingAt: nextBilling.toISOString(),
    expiresAt: nextBilling.toISOString(),
    usageThisMonth: previous?.planId === plan.id ? previous.usageThisMonth : 0,
    usageLimit: plan.monthlyUsageLimit,
    paystackCustomerCode: verification.data?.customer?.customer_code ?? previous?.paystackCustomerCode ?? null,
    paystackSubscriptionCode: verification.data?.subscription_code ?? previous?.paystackSubscriptionCode ?? null,
    paystackEmailToken: verification.data?.email_token ?? previous?.paystackEmailToken ?? null,
    paystackAuthorizationCode: verification.data?.authorization?.authorization_code ?? previous?.paystackAuthorizationCode ?? null,
    createdAt: previous?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const payment: SubscriptionPayment = {
    id: generateId("subpay"),
    subscriptionId: subscription.id,
    userId,
    planId: plan.id,
    amountCents: expectedAmount,
    billingCycle,
    provider: "paystack",
    reference,
    status: "paid",
    paidAt: now.toISOString(),
    createdAt: now.toISOString(),
  };
  await saveSubscription(subscription);
  await savePayment(payment);
  return { subscription, plan };
}
