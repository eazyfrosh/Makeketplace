import type { SubscriptionPlan } from "@/types/subscriptions";

const now = new Date().toISOString();

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "all-access",
    name: "EazyTool All Access",
    description: "One plan for EazyTool's available subscription tools and templates.",
    monthlyPriceCents: 3500000,
    yearlyPriceCents: 25000000,
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
