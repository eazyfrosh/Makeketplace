"use client";

import * as React from "react";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Subscription, SubscriptionPlan } from "@/types/subscriptions";

export default function AdminSubscriptionsPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/subscriptions/admin", { headers });
    const data = await response.json();
    setPlans(data.plans ?? []);
    setSubscriptions(data.subscriptions ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  async function save(plan: SubscriptionPlan) {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/subscriptions/admin", { method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(plan) });
    if (!response.ok) throw new Error((await response.json()).error ?? "Could not save plan.");
    toast.success(`${plan.name} plan updated.`);
    await load();
  }

  if (authLoading || !isAdmin) return <div className="flex justify-center py-24"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  const filtered = subscriptions.filter((item) => `${item.email} ${item.planName}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold tracking-tight">Subscription management</h1><p className="mt-2 text-muted-foreground">Configure plan pricing and usage limits, then monitor active subscribers.</p>
    {!loading && !plans.length && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm"><ShieldAlert className="size-4 shrink-0 text-amber-500" />No plans are configured yet.</div>}
    <section className="mt-8 grid gap-4 lg:grid-cols-3">{plans.map((plan) => <div key={plan.id} className="glass rounded-2xl p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">{plan.name}</h2>{plan.popular && <Badge>Most popular</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{plan.description}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Monthly price<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" type="number" value={plan.monthlyPriceCents} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, monthlyPriceCents: Number(e.target.value) } : item))} /></label><label className="text-xs text-muted-foreground">Yearly price<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" type="number" value={plan.yearlyPriceCents} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, yearlyPriceCents: Number(e.target.value) } : item))} /></label></div><label className="mt-3 block text-xs text-muted-foreground">Monthly usage limit<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" type="number" value={plan.monthlyUsageLimit} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, monthlyUsageLimit: Number(e.target.value) } : item))} /></label><div className="mt-4 flex items-center justify-between"><span className="text-xs text-muted-foreground">{formatPrice(plan.monthlyPriceCents)} / month</span><Button size="sm" onClick={() => save(plan)}>Save plan</Button></div></div>)}</section>
    <section className="mt-12"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Subscribers</h2><p className="mt-1 text-sm text-muted-foreground">{subscriptions.length} subscription records</p></div><div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search email or plan" value={query} onChange={(e) => setQuery(e.target.value)} /></div></div><div className="mt-5 overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-card text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Plan</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Started</th><th className="px-4 py-3 font-medium">Next billing</th><th className="px-4 py-3 font-medium">Usage</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-4 py-3">{item.email}</td><td className="px-4 py-3">{item.planName}</td><td className="px-4 py-3"><Badge variant={item.status === "active" ? "default" : "outline"} className="capitalize">{item.status}</Badge></td><td className="px-4 py-3">{new Date(item.startedAt).toLocaleDateString()}</td><td className="px-4 py-3">{item.nextBillingAt ? new Date(item.nextBillingAt).toLocaleDateString() : "—"}</td><td className="px-4 py-3">{item.usageThisMonth} / {item.usageLimit}</td></tr>)}</tbody></table></div></section>
  </main>;
}
