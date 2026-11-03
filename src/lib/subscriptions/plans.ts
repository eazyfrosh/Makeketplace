import type { SubscriptionBillingCycle, SubscriptionPlan } from "@/types/subscriptions";

const now = new Date().toISOString();

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "all-access",
    name: "EazyTool All Access",
    description: "One plan for EazyTool's available subscription tools and templates.",
    monthlyPriceCents: 3500000,
    sixMonthPriceCents: 10000000,
    yearlyPriceCents: 20000000,
    monthlyPlanCode: null,
    yearlyPlanCode: null,
    monthlyUsageLimit: 1000000,
    includedTools: ["*"],
    features: [
      "Access to all currently available subscription tools",
      "Website Builder templates and private owner editors",
      "Support website designs and publishing tools",
      "New subscription tools when they become available",
    ],
    active: true,
    updatedAt: now,
  },
];

export function getDefaultPlan(id: string) {
  return DEFAULT_SUBSCRIPTION_PLANS.find((plan) => plan.id === id) ?? null;
}

export function planPriceMinor(plan: SubscriptionPlan, cycle: SubscriptionBillingCycle): number {
  if (cycle === "six_months") return plan.sixMonthPriceCents;
  return cycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
}
