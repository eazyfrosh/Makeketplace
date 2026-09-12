export type SubscriptionPlanId = "all-access";
export type SubscriptionBillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "free" | "active" | "past_due" | "cancelled" | "expired";

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
  reference: string;
  status: "paid" | "failed" | "pending";
  paidAt: string | null;
  createdAt: string;
}

export interface SubscriptionSnapshot {
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  payments: SubscriptionPayment[];
}
