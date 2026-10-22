"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { services } from "@/lib/data/services";
import { trackSubscriptionSelection } from "@/lib/analytics/ga4";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types/subscriptions";

const serviceBenefits: Record<string, string> = {
  "premium-templates": "Customize a website template and manage it from your private owner dashboard.",
  "banking-platform": "Use the demo banking dashboard to manage sample accounts and transactions.",
  "airline-booking-platform": "Create and save sample flight itineraries and boarding passes.",
  "logistics-platform": "Create shipments, share tracking numbers, and update delivery progress.",
  "receipt-generator": "Design, preview, and download professional demo receipts.",
  "email-designer": "Design reusable emails, preview them, and send from a verified domain.",
  "qr-code-generator": "Create and download QR codes for links, contact details, and more.",
  "support-website-templates": "Customize and publish a branded customer help website.",
};

const includedServices = services.filter((service) => !service.comingSoon && service.slug !== "sms-messaging");

export function PricingClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function subscribe(plan: SubscriptionPlan) {
    if (authLoading) return;
    trackSubscriptionSelection(plan.id);
    if (!user) {
      router.push("/auth/login?next=/pricing");
      return;
    }
    setStarting(plan.id);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/subscriptions/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ planId: plan.id }),
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
        <Badge variant="soft"><Sparkles className="mr-1 size-3" /> EazyTool All Access</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Simple Pricing. One Subscription. All Your Tools.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">One subscription gives you access to the available EazyTool tools and templates listed below.</p>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : (
        <div className="mx-auto mt-14 grid max-w-5xl gap-5">
          {plans.map((plan) => {
            const price = plan.monthlyPriceCents;
            return (
              <article key={plan.id} className={`relative flex flex-col rounded-3xl border p-6 sm:p-8 ${plan.popular ? "border-primary bg-primary/[0.07] shadow-[0_25px_80px_-40px_rgba(99,102,241,0.75)]" : "border-border bg-card/60"}`}>
                {plan.popular && <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground">Most popular</div>}
                <div className="grid gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-10">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                    <div className="mt-7 flex items-baseline gap-2"><span className="text-4xl font-semibold tracking-tight">{formatPrice(price)}</span><span className="text-sm text-muted-foreground">/month</span></div>
                    <p className="mt-3 text-sm font-medium text-primary">Access to the services below while your subscription is active</p>
                    <Button className="mt-7 w-full" variant={plan.popular ? "default" : "secondary"} disabled={authLoading || starting === plan.id} onClick={() => subscribe(plan)}>
                      {starting === plan.id ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
                    </Button>
                    {!user && !authLoading && <p className="mt-3 text-center text-xs text-muted-foreground">You&apos;ll be asked to log in before subscribing.</p>}
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-5 sm:p-6">
                    <h3 className="font-semibold">What your subscription gives you</h3>
                    <ul className="mt-4 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-6"><Check className="mt-1 size-4 shrink-0 text-emerald-500" />{feature}</li>)}</ul>
                  </div>
                </div>
                <div className="mt-8 border-t border-border/70 pt-7">
                  <h3 className="text-lg font-semibold">Services included</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Explore each tool and choose what you want to create.</p>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">{includedServices.map((service) => <li key={service.slug} className="rounded-2xl border bg-background/60 p-4"><Link href={`/services/${service.slug}`} className="font-semibold text-foreground hover:text-primary hover:underline">{service.name}</Link><p className="mt-1 text-sm leading-6 text-muted-foreground">{serviceBenefits[service.slug] ?? service.tagline}</p></li>)}</ul>
                </div>
                <p className="mt-6 text-sm leading-6 text-muted-foreground">Domain registration and wallet top-ups are separate pay-as-you-go purchases. Sending email also requires a verified sender domain.</p>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
