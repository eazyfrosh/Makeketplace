"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Clock3, Loader2, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { services } from "@/lib/data/services";
import { trackSubscriptionSelection } from "@/lib/analytics/ga4";
import { trackTikTokInitiateCheckout } from "@/lib/analytics/tiktok";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import type { SubscriptionBillingCycle, SubscriptionPlan } from "@/types/subscriptions";

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
const billingOptions: Array<{ cycle: SubscriptionBillingCycle; label: string; access: string; note: string }> = [
  { cycle: "monthly", label: "Monthly", access: "1 month of access", note: "Most flexible" },
  { cycle: "six_months", label: "6 months", access: "6 months of access", note: "Less to renew" },
  { cycle: "yearly", label: "Yearly", access: "12 months of access", note: "Best value" },
];

export function PricingClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState<string | null>(null);
  const checkoutInProgress = React.useRef(false);

  React.useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function subscribe(plan: SubscriptionPlan, billingCycle: SubscriptionBillingCycle) {
    if (authLoading || checkoutInProgress.current) return;
    trackSubscriptionSelection(`${plan.id}_${billingCycle}`);
    if (!user) {
      router.push("/auth/login?next=/pricing");
      return;
    }
    checkoutInProgress.current = true;
    setStarting(`${plan.id}:${billingCycle}`);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/subscriptions/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ planId: plan.id, billingCycle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Could not start subscription.");
      if (typeof data.reference !== "string" || typeof data.authorizationUrl !== "string") throw new Error("Could not start subscription.");
      trackTikTokInitiateCheckout(data.reference);
      window.location.href = data.authorizationUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start subscription.");
      checkoutInProgress.current = false;
      setStarting(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/[0.04] via-background to-background px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <section className="mx-auto max-w-4xl text-center">
          <Badge variant="soft"><Sparkles className="mr-1 size-3" /> EazyTool All Access</Badge>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">One simple plan for all your important tools.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Choose how long you want access, pay once, and use the available EazyTool tools and templates in one familiar workspace.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> One subscription</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-primary" /> No automatic renewal</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" /> Secure checkout</span></div>
        </section>

        {loading ? <div className="flex justify-center py-24"><Loader2 className="size-7 animate-spin text-muted-foreground" /></div> : (
          <div className="mx-auto mt-12 max-w-6xl space-y-6 sm:mt-16">
            {plans.map((plan) => (
              <article key={plan.id} className="overflow-hidden rounded-[2rem] border border-primary/25 bg-card shadow-[0_30px_90px_-50px_rgba(79,70,229,0.7)]">
                <div className="border-b border-border/70 bg-gradient-to-br from-primary/[0.12] via-card to-cyan-500/[0.06] p-6 sm:p-9">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div><Badge variant="outline" className="border-primary/30 bg-background/70 text-primary">All tools and templates</Badge><h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{plan.name}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{plan.description} Choose the access period that fits your work.</p></div>
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><WalletCards className="size-4" /> Pay once, use your tools</div>
                  </div>
                </div>

                <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
                  <div>
                    <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Choose your access period</p><h3 className="mt-1 text-xl font-semibold">How long do you need EazyTool?</h3></div><span className="hidden text-xs text-muted-foreground sm:block">You can choose again later</span></div>
                    <div className="mt-5 grid gap-3">
                      {billingOptions.map(({ cycle, label, access, note }) => {
                        const price = cycle === "yearly" ? plan.yearlyPriceCents : cycle === "six_months" ? plan.sixMonthPriceCents : plan.monthlyPriceCents;
                        const isStarting = starting === `${plan.id}:${cycle}`;
                        const isRecommended = cycle === "yearly";
                        return <div key={cycle} className={`relative rounded-2xl border p-4 transition-colors sm:p-5 ${isRecommended ? "border-primary bg-primary/[0.06] shadow-sm" : "border-border bg-background/60 hover:border-primary/30"}`}>
                          {isRecommended && <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground">Best value</span>}
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{label}</h4><Badge variant="outline" className="text-[11px]">{note}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{access}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><p className="text-2xl font-semibold tracking-tight">{formatPrice(price)}<span className="ml-1 text-xs font-normal text-muted-foreground">total</span></p><Button className="shrink-0" variant={isRecommended ? "default" : "secondary"} disabled={authLoading || Boolean(starting)} aria-label={`Subscribe for ${access} at ${formatPrice(price)}`} onClick={() => subscribe(plan, cycle)}>{isStarting ? <Loader2 className="size-4 animate-spin" /> : <>Choose {label} <ArrowRight className="size-4" /></>}</Button></div></div>
                        </div>;
                      })}
                    </div>
                    <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-500" />Access remains active for the period you pay for. It does not renew automatically.</p>
                    {!user && !authLoading && <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">You’ll be asked to log in before payment so your access is connected to your EazyTool account.</p>}
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/45 p-5 sm:p-6"><h3 className="text-lg font-semibold">Everything included</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">One subscription unlocks the available tools below.</p><ul className="mt-5 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-6"><Check className="mt-1 size-4 shrink-0 text-emerald-500" />{feature}</li>)}</ul><div className="mt-6 rounded-xl border border-primary/15 bg-background/70 p-4 text-sm leading-6"><p className="font-medium">Need a domain?</p><p className="mt-1 text-muted-foreground">Domain registration and wallet top-ups are separate pay-as-you-go purchases.</p><Link href="/domains" className="mt-3 inline-flex items-center gap-1 font-medium text-primary hover:underline">Search domains <ArrowRight className="size-3.5" /></Link></div></div>
                </div>

                <div className="border-t border-border/70 bg-muted/20 p-6 sm:p-9"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h3 className="text-xl font-semibold">Explore what’s included</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Open any tool to see what you can create before choosing a plan.</p></div><p className="text-sm font-medium text-primary">{includedServices.length} available tools</p></div><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{includedServices.map((service) => <li key={service.slug} className="rounded-2xl border border-border/70 bg-background/75 p-4 transition hover:border-primary/35 hover:shadow-sm"><Link href={`/services/${service.slug}`} className="flex items-start justify-between gap-3 font-semibold text-foreground hover:text-primary"><span>{service.name}</span><ArrowRight className="mt-0.5 size-4 shrink-0" /></Link><p className="mt-2 text-sm leading-6 text-muted-foreground">{serviceBenefits[service.slug] ?? service.tagline}</p></li>)}</ul></div>
                <p className="px-6 pb-6 pt-5 text-center text-xs leading-5 text-muted-foreground sm:px-9">Email sending also requires a verified sender domain. Subscription access applies to currently available tools and templates.</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
