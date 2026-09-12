"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import type { SubscriptionBillingCycle, SubscriptionPlan } from "@/types/subscriptions";

export function PricingClient() {
  const { user } = useAuth();
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [cycle, setCycle] = React.useState<SubscriptionBillingCycle>("monthly");
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function subscribe(plan: SubscriptionPlan) {
    if (!user) return;
    setStarting(plan.id);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/subscriptions/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ planId: plan.id, billingCycle: cycle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Could not start subscription.");
      window.location.href = data.authorizationUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start subscription.");
      setStarting(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="soft"><Sparkles className="mr-1 size-3" /> EazyTools All Access</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Simple Pricing. One Subscription. All Your Tools.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">One subscription unlocks every EazyTools service, template, and new tool we add.</p>
        <div className="mt-8 inline-flex rounded-full border border-border bg-card p-1">
          {(["monthly", "yearly"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setCycle(value)} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${cycle === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {value === "monthly" ? "Monthly" : "Yearly · save 40%"}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : (
        <div className="mx-auto mt-14 grid max-w-xl gap-5">
          {plans.map((plan) => {
            const price = cycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
            return (
              <article key={plan.id} className={`relative flex flex-col rounded-3xl border p-7 ${plan.popular ? "border-primary bg-primary/[0.07] shadow-[0_25px_80px_-40px_rgba(99,102,241,0.75)]" : "border-border bg-card/60"}`}>
                {plan.popular && <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground">Most popular</div>}
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                <div className="mt-7 flex items-baseline gap-2"><span className="text-4xl font-semibold tracking-tight">{formatPrice(price)}</span><span className="text-sm text-muted-foreground">/{cycle === "yearly" ? "year" : "month"}</span></div>
                <div className="mt-3 text-sm font-medium text-primary">Full platform access</div>
                <Button className="mt-7 w-full" variant={plan.popular ? "default" : "secondary"} disabled={!user || starting === plan.id} onClick={() => subscribe(plan)}>
                  {starting === plan.id ? <Loader2 className="size-4 animate-spin" /> : user ? `Subscribe to ${plan.name}` : "Sign in to subscribe"}
                </Button>
                {!user && <Link href="/auth/login?next=/pricing" className="mt-3 text-center text-xs text-muted-foreground underline underline-offset-4">Already have an account? Sign in</Link>}
                <div className="mt-8 border-t border-border/70 pt-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Included</p><ul className="mt-4 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />{feature}</li>)}</ul></div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
