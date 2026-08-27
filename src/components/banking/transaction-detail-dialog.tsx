"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { transactionLabels, statusColors } from "@/lib/banking/transaction-meta";
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/banking/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/banking/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium break-words">{value}</span>
    </div>
  );
}

export function TransactionDetailDialog({
  transaction,
  onOpenChange,
}: {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isCredit = transaction?.direction === "credit";

  return (
    <Dialog open={!!transaction} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-lg">
        {transaction && (
          <div className="flex flex-col">
            <DialogTitle className="sr-only">Transaction receipt</DialogTitle>

            <div className="from-primary/10 to-accent/10 flex flex-col items-center gap-2 bg-gradient-to-br px-6 pt-8 pb-6 text-center">
              <Badge variant={statusColors[transaction.status]} className="capitalize">
                {transaction.status}
              </Badge>
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  isCredit ? "text-success" : "text-foreground",
                )}
              >
                {isCredit ? "+" : "-"}
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
              <p className="text-muted-foreground text-sm">{transactionLabels[transaction.type]}</p>
              <p className="text-muted-foreground text-xs">
                {formatDate(transaction.createdAt, { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>

            <div className="divide-border/60 flex flex-col divide-y px-6">
              <div className="py-1">
                <DetailRow label="Reference" value={transaction.reference} />
              </div>
              <div className="py-1">
                <DetailRow label="Recipient" value={transaction.counterparty} />
                <DetailRow
                  label="Recipient account"
                  value={transaction.counterpartyAccount ? maskAccountNumber(transaction.counterpartyAccount) : undefined}
                />
                <DetailRow label="Bank" value={transaction.recipientBank} />
              </div>
              <div className="py-1">
                <DetailRow label="Description" value={transaction.description} />
                <DetailRow
                  label="Fee"
                  value={transaction.fee ? formatCurrency(transaction.fee, transaction.currency) : "No fee"}
                />
                <DetailRow label="Currency" value={transaction.currency} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-6 py-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigator.clipboard.writeText(transaction.reference).then(() => toast.success("Reference copied"))
                }
              >
                <Copy className="size-3.5" />
                Copy reference
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                Print
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
