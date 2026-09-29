"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, History, Loader2, Plus, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { Wallet, WalletTransaction } from "@/lib/wallet/types";

const money = (minor: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
const quick = [500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];

function WalletContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [wallet, setWallet] = React.useState<Wallet | null>(null);
  const [recent, setRecent] = React.useState<WalletTransaction[]>([]);
  const [limits, setLimits] = React.useState<Record<string, number> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [modal, setModal] = React.useState(false);
  const [amount, setAmount] = React.useState(10000);
  const [paying, setPaying] = React.useState(false);

  const load = React.useCallback(async () => {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/wallet", { headers, cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Your wallet could not be loaded.");
    setWallet(data.wallet); setRecent(data.recentTransactions ?? []); setLimits(data.limits);
  }, []);

  React.useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?next=/wallet");
    if (user) load().catch((error) => toast.error(error instanceof Error ? error.message : "Your wallet could not be loaded.")).finally(() => setLoading(false));
  }, [authLoading, user, router, load]);

  React.useEffect(() => {
    const reference = params.get("reference");
    if (!user || params.get("funding") !== "processing" || !reference) return;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/wallet/deposits/status?reference=${encodeURIComponent(reference)}`, { headers, cache: "no-store" });
      const data = await res.json();
      if (data.status === "completed") { toast.success(`${money(data.amountMinor)} has been added to your EazyTool balance.`); await load(); router.replace("/wallet"); return; }
      if (data.status === "failed") { toast.error("Payment failed. Your wallet was not credited."); router.replace("/wallet"); return; }
      if (attempts < 12) window.setTimeout(poll, 2500); else toast.info("Payment is still processing. Your balance will update after Paystack confirms it.");
    };
    void poll();
  }, [user, params, load, router]);

  async function fund() {
    setPaying(true);
    try {
      const amountMinor = Math.round(amount * 100);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/wallet/deposits/initialize", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ amountMinor }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to start payment.");
      window.location.href = data.authorizationUrl;
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to start payment."); setPaying(false); }
  }

  if (authLoading || loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  const available = wallet?.balanceMinor ?? 0;

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Your balance</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Wallet</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Add money here to pay for domains, SMS credits, and eligible EazyTool services. Your balance changes only after payment is verified.</p></div><Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">Back to dashboard</Link></div>
    <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-7 text-primary-foreground shadow-xl sm:p-10"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-sm opacity-80"><WalletCards className="size-4" />Available to use</div><div className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">{money(available)}</div><p className="mt-3 max-w-xl text-sm opacity-75">Use your balance during checkout. We never mark a deposit complete until the payment provider confirms it.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setModal(true)}><Plus className="size-4" />Add funds</Button><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild><Link href="/wallet/transactions"><History className="size-4" />View transactions</Link></Button></div></div></section>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">{[["Available balance", wallet?.balanceMinor ?? 0], ["Total deposited", wallet?.totalDepositedMinor ?? 0], ["Total spent", wallet?.totalSpentMinor ?? 0]].map(([label, value]) => <div key={String(label)} className="glass rounded-2xl p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{money(Number(value))}</p></div>)}</div>
    <section className="mt-10" aria-labelledby="recent-transactions"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Your activity</p><h2 id="recent-transactions" className="mt-1 text-xl font-semibold">Recent transactions</h2></div><Button variant="ghost" size="sm" asChild><Link href="/wallet/transactions">View all</Link></Button></div><div className="mt-4 overflow-hidden rounded-2xl border bg-card">{recent.length === 0 ? <div className="p-10 text-center"><CheckCircle2 className="mx-auto size-7 text-primary" /><p className="mt-3 font-medium">No transactions yet</p><p className="mt-1 text-sm text-muted-foreground">When you add or spend funds, the activity will appear here.</p></div> : recent.map((tx) => <Link href={`/wallet/transactions/${tx.id}`} key={tx.id} className="flex items-center justify-between gap-4 border-b p-4 last:border-0 hover:bg-accent/40"><div className="flex min-w-0 items-center gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-full ${tx.direction === "credit" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"}`}>{tx.direction === "credit" ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}</span><div className="min-w-0"><p className="truncate font-medium">{tx.description}</p><p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()} · <span className="capitalize">{tx.status}</span></p></div></div><p className={`shrink-0 font-semibold ${tx.direction === "credit" ? "text-emerald-600" : ""}`}>{tx.direction === "credit" ? "+" : "-"}{money(tx.amountMinor)}</p></Link>)}</div></section>
    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="add-funds-title" className="w-full max-w-lg rounded-3xl bg-background p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Step 1 of 2</p><h2 id="add-funds-title" className="mt-1 text-2xl font-semibold">How much would you like to add?</h2><p className="mt-1 text-sm text-muted-foreground">You will review and complete payment securely on Paystack next.</p></div><button type="button" onClick={() => setModal(false)} aria-label="Close add funds dialog" className="rounded-full p-2 hover:bg-accent"><X className="size-5" /></button></div><label htmlFor="wallet-amount" className="mt-6 block text-sm font-medium">Amount in Nigerian naira</label><div className="mt-2 flex h-14 items-center rounded-xl border px-4 text-xl"><span className="mr-2">₦</span><input id="wallet-amount" className="w-full bg-transparent outline-none" type="number" min={(limits?.minimumDepositMinor ?? 100000) / 100} max={(limits?.maximumSingleDepositMinor ?? 100000000) / 100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div><div className="mt-4 flex flex-wrap gap-2">{quick.map((value) => <button type="button" key={value} onClick={() => setAmount(value / 100)} className="rounded-full border px-3 py-1.5 text-sm hover:bg-accent">{money(value)}</button>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Minimum {money(limits?.minimumDepositMinor ?? 100000)} · Maximum per deposit {money(limits?.maximumSingleDepositMinor ?? 100000000)} · Daily limit {money(limits?.maximumDailyFundingMinor ?? 200000000)}</p><Button className="mt-6 w-full" size="lg" disabled={paying || amount <= 0} onClick={fund}>{paying ? <Loader2 className="size-4 animate-spin" /> : <Clock className="size-4" />}Continue to secure payment</Button></div></div>}
  </main>;
}

export default function WalletPage() { return <React.Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>}><WalletContent /></React.Suspense>; }
