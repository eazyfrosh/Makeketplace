import type { Metadata } from "next";

import { PricingClient } from "@/components/subscriptions/pricing-client";

export const metadata: Metadata = {
  title: "Simple Pricing. One Subscription. All Your Tools.",
  description: "Choose the EazyTools plan that fits your workflow and access a growing collection of practical tools.",
};

export default function PricingPage() {
  return <PricingClient />;
}
