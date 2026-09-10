import type { SubscriptionPlan } from "@/types/subscriptions";

const now = new Date().toISOString();

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Essential tools for getting everyday work done.",
    monthlyPriceCents: 150000,
    yearlyPriceCents: 1500000,
    monthlyPlanCode: process.env.PAYSTACK_STARTER_MONTHLY_PLAN_CODE ?? null,
    yearlyPlanCode: process.env.PAYSTACK_STARTER_YEARLY_PLAN_CODE ?? null,
    monthlyUsageLimit: 30,
    includedTools: ["receipt-generator"],
    features: ["Basic EazyTools access", "30 actions per month", "Standard support"],
    active: true,
    updatedAt: now,
  },
  {
    id: "pro",
    name: "Pro",
    description: "More tools, more capacity, and priority support.",
    monthlyPriceCents: 500000,
    yearlyPriceCents: 5000000,
    monthlyPlanCode: process.env.PAYSTACK_PRO_MONTHLY_PLAN_CODE ?? null,
    yearlyPlanCode: process.env.PAYSTACK_PRO_YEARLY_PLAN_CODE ?? null,
    monthlyUsageLimit: 100,
    includedTools: ["receipt-generator", "logistics-platform", "airline-booking-platform"],
    features: ["Most EazyTools tools", "100 actions per month", "Priority processing", "Priority support"],
    popular: true,
    active: true,
    updatedAt: now,
  },
  {
    id: "business",
    name: "Business",
    description: "The complete workspace for teams and growing businesses.",
    monthlyPriceCents: 1200000,
    yearlyPriceCents: 12000000,
    monthlyPlanCode: process.env.PAYSTACK_BUSINESS_MONTHLY_PLAN_CODE ?? null,
    yearlyPlanCode: process.env.PAYSTACK_BUSINESS_YEARLY_PLAN_CODE ?? null,
    monthlyUsageLimit: 500,
    includedTools: ["*"],
    features: ["All available tools", "500 actions per month", "Premium features", "Priority support"],
    active: true,
    updatedAt: now,
  },
];

export function getDefaultPlan(id: string) {
  return DEFAULT_SUBSCRIPTION_PLANS.find((plan) => plan.id === id) ?? null;
}
