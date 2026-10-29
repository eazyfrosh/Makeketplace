"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";

type RecoveryResult = {
  state: "ready" | "not_paid" | "already_applied" | "activated";
  reference: string;
  email?: string;
  amountMinor?: number;
  currency?: string;
  paidAt?: string | null;
  planName?: string;
  paymentStatus?: string;
  expiresAt?: string | null;
};

export function AdminPaymentRecovery({ onActivated }: { onActivated: () => void }) {
  const [reference, setReference] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [result, setResult] = React.useState<RecoveryResult | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(action: "inspect" | "activate") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/subscriptions/admin/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action, reference: reference.trim(), email: email.trim() }),
      });
      const data = await response.json() as RecoveryResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not check this payment.");
      setResult(data);
      if (data.state === "activated") onActivated();
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "Could not check this payment.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <h2 className="text-xl font-semibold">Recover a confirmed payment</h2>
    <p className="mt-1 text-sm text-muted-foreground">Use this when Paystack received a subscription payment but the customer still has no access. Check the details before activating.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">Paystack transaction reference
        <Input value={reference} onChange={(event) => { setReference(event.target.value); setResult(null); }} placeholder="Paystack reference" autoComplete="off" />
      </label>
      <label className="grid gap-2 text-sm font-medium">Customer&apos;s EazyTool email
        <Input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setResult(null); }} placeholder="customer@example.com" autoComplete="off" />
      </label>
    </div>
    <Button className="mt-5" disabled={busy || !reference.trim() || !email.trim()} onClick={() => submit("inspect")}>{busy ? "Checking…" : "Verify with Paystack"}</Button>
    {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {result?.state === "not_paid" && <p className="mt-4 rounded-xl border p-3 text-sm">Paystack has not confirmed this payment yet ({result.paymentStatus}). No access was changed.</p>}
    {result?.state === "already_applied" && <p className="mt-4 rounded-xl border p-3 text-sm">This payment is already recorded for this account. Refresh the subscriber list or ask the customer to sign in again.</p>}
    {result?.state === "ready" && <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
      <p className="font-semibold">Verified successful payment</p>
      <p className="mt-2">Account: {result.email}</p>
      <p>Amount: {formatPrice(result.amountMinor ?? 0)} {result.currency}</p>
      <p>Plan: {result.planName}</p>
      {result.paidAt && <p>Paid: {new Date(result.paidAt).toLocaleString()}</p>}
      <Button className="mt-4" disabled={busy} onClick={() => submit("activate")}>{busy ? "Activating…" : "Activate this verified subscription"}</Button>
    </div>}
    {result?.state === "activated" && <p role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">Subscription activated. Access expires {result.expiresAt ? new Date(result.expiresAt).toLocaleString() : "after the billing period"}.</p>}
  </section>;
}
