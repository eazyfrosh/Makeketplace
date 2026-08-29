"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";

import { useBankingAccount } from "@/lib/banking/use-account";
import { editOwnTransaction } from "@/lib/banking/client";
import { transactionLabels, statusColors } from "@/lib/banking/transaction-meta";
import { formatCurrency, formatDate } from "@/lib/banking/format";
import type { Transaction, TransactionStatus } from "@/lib/banking/types";

import { TransactionDetailDialog } from "@/components/banking/transaction-detail-dialog";
import { EditTransactionDialog } from "@/components/banking/edit-transaction-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const statusFilters: (TransactionStatus | "all")[] = ["all", "completed", "pending", "failed", "cancelled"];

export default function TransactionsPage() {
  const { data, loading, error, reload } = useBankingAccount();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<TransactionStatus | "all">("all");
  const [direction, setDirection] = React.useState<"all" | "credit" | "debit">("all");
  const [sortDir, setSortDir] = React.useState<"desc" | "asc">("desc");
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  const filtered = React.useMemo(() => {
    let result = data?.transactions ?? [];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (tx) => tx.description.toLowerCase().includes(q) || tx.reference.toLowerCase().includes(q),
      );
    }
    if (status !== "all") result = result.filter((tx) => tx.status === status);
    if (direction !== "all") result = result.filter((tx) => tx.direction === direction);
    return [...result].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [data?.transactions, query, status, direction, sortDir]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Transactions</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search description or reference..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus | "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="credit">Credits</SelectItem>
            <SelectItem value="debit">Debits</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          aria-label="Toggle sort order"
        >
          {sortDir === "desc" ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No transactions found" description="Try adjusting your search or filters." />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedTx(tx)}>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell className="text-muted-foreground">{transactionLabels[tx.type]}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                  <TableCell className={tx.direction === "credit" ? "text-success" : ""}>
                    {tx.direction === "credit" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[tx.status]} className="capitalize">
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{tx.reference}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <EditTransactionDialog
                      transaction={tx}
                      onSave={(updates) => editOwnTransaction(tx.id, updates).then((res) => res.transaction)}
                      onSaved={() => reload()}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TransactionDetailDialog transaction={selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)} />
    </div>
  );
}
