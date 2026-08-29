"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Snowflake, Sun, KeyRound } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/banking/format";
import { transactionLabels, statusColors } from "@/lib/banking/transaction-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { EditTransactionDialog } from "@/components/banking/edit-transaction-dialog";
import type { Account, AccountStatus, BankCard, CardStatus, Transaction } from "@/lib/banking/types";

interface AdminBankingDetail {
  profile: { email: string | null; firstName: string | null; lastName: string | null; createdAt: string };
  account: Account | null;
  card: Omit<BankCard, "cardNumber" | "cvv" | "pin"> | null;
  transactions: Transaction[];
}

export default function AdminBankingUserPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const [data, setData] = React.useState<AdminBankingDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [adjustDirection, setAdjustDirection] = React.useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = React.useState("");
  const [adjustReason, setAdjustReason] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/banking/admin/users/${uid}`, { headers });
    const body = await res.json();
    if (!res.ok) {
      setError(body?.error ?? "Failed to load this user.");
    } else {
      setData(body);
      setError(null);
    }
    setLoading(false);
  }, [uid]);

  React.useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  async function callAction(path: string, init: RequestInit) {
    const headers = await getAuthHeaders();
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...headers, ...(init.headers ?? {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error ?? "Action failed.");
    return body;
  }

  async function toggleAccountStatus(next: AccountStatus) {
    setBusy(true);
    try {
      await callAction(`/api/banking/admin/users/${uid}/account`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast.success(`Account ${next}.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update account.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCardStatus(next: CardStatus) {
    setBusy(true);
    try {
      await callAction(`/api/banking/admin/users/${uid}/card`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast.success(`Card ${next}.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update card.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPin() {
    if (!window.confirm("Reset this user's transaction PIN? They'll be prompted to set a new one.")) return;
    setBusy(true);
    try {
      await callAction(`/api/banking/admin/users/${uid}/pin`, { method: "DELETE" });
      toast.success("PIN reset.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset PIN.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdjustBalance() {
    const amount = Number(adjustAmount);
    if (!(amount > 0) || !adjustReason.trim()) {
      toast.error("Enter a positive amount and a reason.");
      return;
    }
    setBusy(true);
    try {
      await callAction(`/api/banking/admin/users/${uid}/adjust-balance`, {
        method: "POST",
        body: JSON.stringify({ direction: adjustDirection, amount, description: adjustReason.trim() }),
      });
      toast.success("Balance adjusted.");
      setAdjustAmount("");
      setAdjustReason("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust balance.");
    } finally {
      setBusy(false);
    }
  }

  function handleTransactionSaved(updated: Transaction) {
    setData((prev) =>
      prev
        ? { ...prev, transactions: prev.transactions.map((t) => (t.id === updated.id ? updated : t)) }
        : prev,
    );
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/admin/banking" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-3.5" /> Back to banking users
      </Link>

      {loading ? (
        <div className="mt-12 flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error || !data ? (
        <EmptyState className="mt-12" title="Couldn't load this user" description={error ?? "Unknown error."} />
      ) : (
        <>
          <div className="mt-6">
            <h1 className="text-3xl font-semibold tracking-tight">
              {data.profile.firstName} {data.profile.lastName}
            </h1>
            <p className="mt-1 text-muted-foreground">{data.profile.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Banking sign-up: {new Date(data.profile.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-2xl p-5">
              <div className="text-sm text-muted-foreground">Account status</div>
              <div className="mt-1">
                {data.account ? (
                  <Badge variant={data.account.status === "active" ? "default" : "outline"} className="capitalize">
                    {data.account.status}
                  </Badge>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="mt-1 text-xl font-semibold">
                {data.account ? formatCurrency(data.account.balance, data.account.currency) : "—"}
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-sm text-muted-foreground">Account number</div>
              <div className="mt-1 font-mono text-sm">
                {data.account ? maskAccountNumber(data.account.accountNumber) : "—"}
              </div>
            </div>
          </div>

          {data.account && (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.account.status === "active" ? (
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => toggleAccountStatus("frozen")}>
                  <Snowflake className="size-3.5" /> Freeze account
                </Button>
              ) : (
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => toggleAccountStatus("active")}>
                  <Sun className="size-3.5" /> Unfreeze account
                </Button>
              )}
              <Button size="sm" variant="secondary" disabled={busy} onClick={resetPin}>
                <KeyRound className="size-3.5" /> Reset transaction PIN
              </Button>
            </div>
          )}

          {data.card && (
            <div className="glass mt-6 rounded-2xl p-5">
              <div className="text-sm text-muted-foreground">Card</div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="capitalize">
                  {data.card.network} · {data.card.type}
                </span>
                <Badge variant={data.card.status === "active" ? "default" : "outline"} className="capitalize">
                  {data.card.status}
                </Badge>
                {data.card.status === "active" ? (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => toggleCardStatus("frozen")}>
                    <Snowflake className="size-3.5" /> Freeze card
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => toggleCardStatus("active")}>
                    <Sun className="size-3.5" /> Unblock card
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                Card number, CVV, and PIN stay behind the customer&apos;s own PIN-verified reveal — not shown here.
              </p>
            </div>
          )}

          {data.account && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Adjust balance</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-32">
                  <Label>Direction</Label>
                  <Select value={adjustDirection} onValueChange={(v) => setAdjustDirection(v as "credit" | "debit")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex-1">
                  <Label>Reason</Label>
                  <Input
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Refund for support ticket #482"
                  />
                </div>
                <Button disabled={busy} onClick={handleAdjustBalance}>
                  Apply
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold">Transactions</h2>
            {data.transactions.length === 0 ? (
              <EmptyState className="mt-6" title="No transactions yet" description="This user hasn't made any transactions." />
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.03] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{tx.description}</td>
                        <td className="px-4 py-3 text-muted-foreground">{transactionLabels[tx.type]}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className={tx.direction === "credit" ? "px-4 py-3 text-success" : "px-4 py-3"}>
                          {tx.direction === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColors[tx.status]} className="capitalize">
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <EditTransactionDialog
                            transaction={tx}
                            onSave={(updates) =>
                              callAction(`/api/banking/admin/users/${uid}/transactions/${tx.id}`, {
                                method: "PATCH",
                                body: JSON.stringify(updates),
                              }).then((body) => body.transaction)
                            }
                            onSaved={handleTransactionSaved}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
