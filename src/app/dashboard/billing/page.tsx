"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ReceiptText } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Subscription, SubscriptionPayment, SubscriptionPlan } from "@/types/subscriptions";

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [plan, setPlan] = React.useState<SubscriptionPlan | null>(null);
  const [payments, setPayments] = React.useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    getAuthHeaders().then((headers) => fetch("/api/subscriptions/me", { headers }).then((res) => res.json()).then((data) => { setSubscription(data.subscription ?? null); setPlan(data.plan ?? null); setPayments(data.payments ?? []); }).finally(() => setLoading(false)));
  }, [user]);

  if (authLoading || loading) return <div className="flex justify-center py-24"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-semibold">Sign in to manage billing</h1><Button className="mt-6" asChild><Link href="/auth/login?next=/dashboard/billing">Sign in</Link></Button></main>;

  return <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Account billing</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Subscription & billing</h1><p className="mt-3 text-muted-foreground">One subscription gives you access to the tools included in your plan.</p></div><Button variant="secondary" asChild><Link href="/pricing">Upgrade plan</Link></Button></div>
    <section className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="glass rounded-3xl p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Current plan</p><h2 className="mt-2 text-3xl font-semibold">{plan?.name ?? "Free"}</h2></div><Badge variant={subscription?.status === "active" ? "default" : "outline"} className="capitalize">{subscription?.status ?? "free"}</Badge></div><div className="mt-8 grid gap-5 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Price</p><p className="mt-1 font-medium">{subscription && plan ? formatPrice(subscription.billingCycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents) : "—"}</p></div><div><p className="text-xs text-muted-foreground">Billing cycle</p><p className="mt-1 font-medium capitalize">{subscription?.billingCycle ?? "—"}</p></div><div><p className="text-xs text-muted-foreground">Next billing</p><p className="mt-1 font-medium">{subscription?.nextBillingAt ? new Date(subscription.nextBillingAt).toLocaleDateString() : "—"}</p></div></div><div className="mt-8 flex flex-wrap gap-2"><Button asChild><Link href="/pricing">Change plan</Link></Button><Button variant="secondary" disabled={!subscription}>Cancel subscription</Button></div></div>
      <div className="rounded-3xl border border-primary/20 bg-primary/[0.06] p-6 sm:p-8"><ReceiptText className="size-5 text-primary" /><h2 className="mt-4 text-xl font-semibold">Usage this month</h2><p className="mt-2 text-3xl font-semibold">{subscription?.usageThisMonth ?? 0}<span className="text-base font-normal text-muted-foreground"> / {subscription?.usageLimit ?? 0}</span></p><p className="mt-2 text-sm text-muted-foreground">Actions used across your included tools.</p></div>
    </section>
    <section className="mt-10"><h2 className="text-xl font-semibold">Payment history</h2>{payments.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Your verified Paystack payments will appear here.</p> : <div className="mt-4 overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-card text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Plan</th><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Amount</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-t border-border"><td className="px-4 py-3">{new Date(payment.createdAt).toLocaleDateString()}</td><td className="px-4 py-3 capitalize">{payment.planId}</td><td className="px-4 py-3 font-mono text-xs">{payment.reference}</td><td className="px-4 py-3"><Badge variant={payment.status === "paid" ? "default" : "outline"}>{payment.status}</Badge></td><td className="px-4 py-3 text-right">{formatPrice(payment.amountCents)}</td></tr>)}</tbody></table></div>}</section>
  </main>;
}
