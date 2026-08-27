import { formatCurrency, formatDate } from "@/lib/banking/format";
import { transactionIcons, transactionLabels, statusColors } from "@/lib/banking/transaction-meta";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/banking/types";

export function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}) {
  const Icon = transactionIcons[transaction.type];
  const isCredit = transaction.direction === "credit";

  return (
    <div
      className={
        onClick
          ? "hover:bg-muted/50 -mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 transition-colors"
          : "flex items-center gap-3 py-3"
      }
      onClick={onClick ? () => onClick(transaction) : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(transaction);
              }
            }
          : undefined
      }
    >
      <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{transaction.description}</p>
        <p className="text-muted-foreground text-xs">
          {transactionLabels[transaction.type]} &middot; {formatDate(transaction.createdAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={isCredit ? "text-success text-sm font-semibold" : "text-sm font-semibold"}>
          {isCredit ? "+" : "-"}
          {formatCurrency(transaction.amount, transaction.currency)}
        </p>
        <Badge variant={statusColors[transaction.status]} className="mt-0.5 capitalize">
          {transaction.status}
        </Badge>
      </div>
    </div>
  );
}
