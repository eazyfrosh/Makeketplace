"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, MousePointerClick, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { Affiliate, AffiliateCommission, AffiliateReferral } from "@/lib/affiliate/types";

interface MeResponse {
  affiliate: Affiliate | null;
  referrals: AffiliateReferral[];
  commissions: AffiliateCommission[];
  pendingCents: number;
  paidCents: number;
}

export default function AffiliateDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = React.useState<MeResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [requestingPayout, setRequestingPayout] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const headers = await getAuthHeaders();
    const res = await fetch("/api/affiliate/me", { headers });
    const body = await res.json();
    setData(body);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  React.useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function handleJoin() {
    setJoining(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/affiliate/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to join the affiliate program.");
      toast.success("Welcome to the affiliate program!");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join the affiliate program.");
    } finally {
      setJoining(false);
    }
  }

  async function handleRequestPayout() {
    setRequestingPayout(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/affiliate/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to request a payout.");
      toast.success("Payout requested.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request a payout.");
    } finally {
      setRequestingPayout(false);
    }
  }

  function copyLink() {
    if (!data?.affiliate) return;
    const link = `${window.location.origin}/?ref=${data.affiliate.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied.");
  }

  if (authLoading || loading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.affiliate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="glass rounded-2xl p-10">
          <h1 className="text-2xl font-semibold">Join the affiliate program</h1>
          <p className="text-muted-foreground mt-2">
            Get your own referral link and earn a commission on every purchase made by someone you refer to
            Nexova.
          </p>
          <Button className="mt-8" onClick={handleJoin} disabled={joining}>
            {joining ? "Joining…" : "Get my referral link"}
          </Button>
        </div>
      </div>
    );
  }

  const { affiliate, referrals, commissions, pendingCents, paidCents } = data;
  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${affiliate.code}`;
  const hasPendingRequest = commissions.some((c) => c.payoutRequestId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Affiliate dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Share your link. You earn {affiliate.commissionRatePercent}% commission on every purchase made by
        someone who signs up through it.
      </p>

      <div className="glass mt-8 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center">
        <Input readOnly value={referralLink} className="font-mono text-sm" />
        <Button variant="secondary" onClick={copyLink} className="shrink-0">
          <Copy className="size-4" /> Copy link
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="glass rounded-2xl p-5">
          <MousePointerClick className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{affiliate.totalClicks}</div>
          <div className="text-sm text-muted-foreground">Link clicks</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <Users className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{referrals.length}</div>
          <div className="text-sm text-muted-foreground">Referred sign-ups</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <Wallet className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{formatPrice(pendingCents)}</div>
          <div className="text-sm text-muted-foreground">Pending earnings</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <Wallet className="size-5 text-emerald-400" />
          <div className="mt-3 text-2xl font-semibold">{formatPrice(paidCents)}</div>
          <div className="text-sm text-muted-foreground">Paid out</div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Commissions</h2>
        <Button
          variant="secondary"
          size="sm"
          disabled={requestingPayout || pendingCents === 0 || hasPendingRequest}
          onClick={handleRequestPayout}
        >
          {hasPendingRequest
            ? "Payout requested"
            : requestingPayout
              ? "Requesting…"
              : "Request payout"}
        </Button>
      </div>

      {commissions.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No commissions yet"
          description="They'll show up here as soon as someone you referred makes a purchase."
        />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order total</th>
                <th className="px-4 py-3 font-medium">Your commission</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{formatPrice(c.orderTotalCents)}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(c.commissionCents)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === "paid" ? "default" : "outline"} className="capitalize">
                      {c.status === "pending" && c.payoutRequestId ? "requested" : c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
