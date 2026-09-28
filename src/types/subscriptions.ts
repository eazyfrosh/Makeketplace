export type SubscriptionPlanId = "all-access";
export type SubscriptionBillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "free" | "active" | "non_renewing" | "past_due" | "cancelled" | "expired";
export type SubscriptionPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyPlanCode: string | null;
  yearlyPlanCode: string | null;
  monthlyUsageLimit: number;
  includedTools: string[];
  features: string[];
  popular?: boolean;
  active: boolean;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  email: string;
  planId: string;
  planName: string;
  billingCycle: SubscriptionBillingCycle;
  status: SubscriptionStatus;
  startedAt: string;
  nextBillingAt: string | null;
  expiresAt: string | null;
  usageThisMonth: number;
  usageLimit: number;
  paystackCustomerCode: string | null;
  paystackSubscriptionCode: string | null;
  paystackEmailToken: string | null;
  paystackAuthorizationCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  userId: string;
  planId: string;
  amountCents: number;
  billingCycle: SubscriptionBillingCycle;
  provider: "paystack";
  purpose: "subscription";
  currency: "NGN";
  reference: string;
  providerTransactionId: string | null;
  status: SubscriptionPaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPaymentIntent {
  id: string;
  userId: string;
  email: string;
  planId: string;
  billingCycle: SubscriptionBillingCycle;
  amountMinor: number;
  currency: "NGN";
  purpose: "subscription";
  reference: string;
  status: SubscriptionPaymentStatus;
  providerTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSnapshot {
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  payments: SubscriptionPayment[];
}
