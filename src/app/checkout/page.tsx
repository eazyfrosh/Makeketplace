import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Subscription Checkout",
  description: "Choose an EazyTools subscription plan and pay securely with Paystack.",
};

export default function CheckoutPage() {
  return <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-20"><div className="glass w-full rounded-3xl p-8 text-center sm:p-12"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">EazyTools subscriptions</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">Your tools now live under one plan.</h1><p className="mt-4 text-muted-foreground">Individual service purchases have been replaced with a simple subscription. Choose Starter, Pro, or Business to unlock the tools included in your workflow.</p><Button className="mt-8" asChild><Link href="/pricing">View subscription plans</Link></Button></div></main>;
}
