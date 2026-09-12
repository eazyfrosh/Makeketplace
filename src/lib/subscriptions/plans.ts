import type { SubscriptionPlan } from "@/types/subscriptions";

const now = new Date().toISOString();

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "all-access",
    name: "EazyTools All Access",
    description: "One subscription for every EazyTools service, template, and future release.",
    monthlyPriceCents: 3500000,
    yearlyPriceCents: 25000000,
    monthlyPlanCode: process.env.PAYSTACK_ALL_ACCESS_MONTHLY_PLAN_CODE ?? null,
    yearlyPlanCode: process.env.PAYSTACK_ALL_ACCESS_YEARLY_PLAN_CODE ?? null,
    monthlyUsageLimit: 1000000,
    includedTools: ["*"],
    features: ["Every EazyTools service", "All support and premium templates", "New tools included automatically", "Priority support"],
    active: true,
    updatedAt: now,
  },
];

export function getDefaultPlan(id: string) {
  return DEFAULT_SUBSCRIPTION_PLANS.find((plan) => plan.id === id) ?? null;
}
