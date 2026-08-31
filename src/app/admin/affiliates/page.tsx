"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Affiliate, AffiliatePayoutRequest } from "@/lib/affiliate/types";

interface AffiliateRow {
  affiliate: Affiliate;
  referralCount: number;
  pendingCents: number;
  paidCents: number;
}

interface PayoutRow {
  payoutRequest: AffiliatePayoutRequest;
  affiliate: Affiliate | null;
}

export default function AdminAffiliatesPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const [rows, setRows] = React.useState<AffiliateRow[]>([]);
  const [payouts, setPayouts] = React.useState<PayoutRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const headers = await getAuthHeaders();
    const [affiliatesRes, payoutsRes] = await Promise.all([
      fetch("/api/affiliate/admin/list", { headers }),
      fetch("/api/affiliate/admin/payout-requests", { headers }),
    ]);
    const affiliatesBody = await affiliatesRes.json();
    const payoutsBody = await payoutsRes.json();
    setRows(affiliatesBody.rows ?? []);
    setPayouts(payoutsBody.rows ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function resolvePayout(id: string, action: "paid" | "rejected") {
    setBusyId(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/affiliate/admin/payout-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Action failed.");
      toast.success(action === "paid" ? "Marked as paid." : "Request rejected.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openPayouts = payouts.filter((p) => p.payoutRequest.status === "requested");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Affiliates</h1>
      <p className="mt-2 text-muted-foreground">Every affiliate, their referrals, and pending payout requests.</p>

      {loading ? (
        <div className="mt-12 flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <h2 className="mt-10 text-xl font-semibold">Payout requests</h2>
          {openPayouts.length === 0 ? (
            <EmptyState className="mt-4" title="No pending payout requests" description="Requests will appear here as affiliates ask to be paid." />
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Affiliate</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Requested</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {openPayouts.map(({ payoutRequest, affiliate }) => (
                    <tr key={payoutRequest.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{affiliate?.email ?? "—"}</td>
                      <td className="px-4 py-3 font-medium">{formatPrice(payoutRequest.amountCents)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(payoutRequest.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === payoutRequest.id}
                            onClick={() => resolvePayout(payoutRequest.id, "paid")}
                          >
                            Mark paid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyId === payoutRequest.id}
                            onClick={() => resolvePayout(payoutRequest.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mt-12 text-xl font-semibold">All affiliates</h2>
          {rows.length === 0 ? (
            <EmptyState className="mt-4" title="No affiliates yet" description="Affiliates appear here once someone joins the program." />
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Rate</th>
                    <th className="px-4 py-3 font-medium">Clicks</th>
                    <th className="px-4 py-3 font-medium">Referrals</th>
                    <th className="px-4 py-3 font-medium">Pending</th>
                    <th className="px-4 py-3 font-medium">Paid</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ affiliate, referralCount, pendingCents, paidCents }) => (
                    <tr key={affiliate.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{affiliate.email}</td>
                      <td className="px-4 py-3 font-mono text-xs">{affiliate.code}</td>
                      <td className="px-4 py-3">{affiliate.commissionRatePercent}%</td>
                      <td className="px-4 py-3">{affiliate.totalClicks}</td>
                      <td className="px-4 py-3">{referralCount}</td>
                      <td className="px-4 py-3">{formatPrice(pendingCents)}</td>
                      <td className="px-4 py-3">{formatPrice(paidCents)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={affiliate.status === "active" ? "default" : "outline"} className="capitalize">
                          {affiliate.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
