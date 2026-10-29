import type { Metadata } from "next";

import { PricingClient } from "@/components/subscriptions/pricing-client";

export const metadata: Metadata = {
  title: "Simple Pricing. One Subscription. All Your Tools.",
  description: "See the tools and templates included with EazyTool All Access.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingClient />;
}
