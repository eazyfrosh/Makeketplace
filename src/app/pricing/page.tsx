import type { Metadata } from "next";

import { PricingClient } from "@/components/subscriptions/pricing-client";

export const metadata: Metadata = {
  title: "Simple Pricing. One Subscription. All Your Tools.",
  description: "Get every EazyTools service for ₦35,000 monthly or ₦250,000 yearly.",
};

export default function PricingPage() {
  return <PricingClient />;
}
