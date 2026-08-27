"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight } from "lucide-react";

import { useBankingAccount } from "@/lib/banking/use-account";
import { getCurrencyInfo } from "@/lib/banking/currencies";
import type { Transaction } from "@/lib/banking/types";

import { AccountCard } from "@/components/banking/account-card";
import { AnimatedCounter } from "@/components/banking/animated-counter";
import { TransactionRow } from "@/components/banking/transaction-row";
import { TransactionDetailDialog } from "@/components/banking/transaction-detail-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function BankingDashboardPage() {
  const { data, loading, error } = useBankingAccount();
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Here&apos;s what&apos;s happening with your money today.
            </p>
          </div>
          {data && (
            <Card className="border-primary/20 bg-primary/5 py-3">
              <CardContent className="flex items-center gap-3 px-4">
                <div>
                  <p className="text-muted-foreground text-xs">Total balance ({data.account.currency})</p>
                  <p className="text-xl font-semibold">
                    <AnimatedCounter
                      value={data.account.balance}
                      prefix={getCurrencyInfo(data.account.currency).symbol}
                      decimals={2}
                    />
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Link
          href="/platform/banking-platform/transfer"
          className="border-border/60 bg-card hover:border-primary/40 hover:shadow-md flex w-fit flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all"
        >
          <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
            <ArrowLeftRight className="size-5" />
          </span>
          <span className="text-xs font-medium">Transfer</span>
        </Link>

        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          data && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AccountCard account={data.account} />
            </div>
          )
        )}

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/platform/banking-platform/transactions">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-border/60 divide-y">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="my-1.5 h-12" />)
            ) : !data || data.transactions.length === 0 ? (
              <EmptyState title="No transactions yet" description="Your recent activity will show up here." />
            ) : (
              data.transactions
                .slice(0, 6)
                .map((tx) => <TransactionRow key={tx.id} transaction={tx} onClick={setSelectedTx} />)
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDetailDialog transaction={selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)} />
    </div>
  );
}
