"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/banking/format";
import { transactionLabels, statusColors } from "@/lib/banking/transaction-meta";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { Account, BankCard, Transaction } from "@/lib/banking/types";

interface AdminBankingDetail {
  profile: { email: string | null; firstName: string | null; lastName: string | null; createdAt: string };
  account: Account | null;
  card: Omit<BankCard, "cardNumber" | "cvv" | "pin"> | null;
  transactions: Transaction[];
}

export default function AdminBankingUserPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const params = useParams<{ uid: string }>();
  const [data, setData] = React.useState<AdminBankingDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/banking/admin/users/${params.uid}`, { headers });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to load this user.");
      } else {
        setData(body);
      }
      setLoading(false);
    })();
  }, [isAdmin, params.uid]);

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
                <span className="text-muted-foreground">
                  Card number, CVV, and PIN stay behind the customer&apos;s own PIN-verified reveal — not shown here.
                </span>
              </div>
            </div>
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
