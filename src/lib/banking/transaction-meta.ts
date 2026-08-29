import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Landmark,
  type LucideIcon,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import type { TransactionStatus, TransactionType } from "@/lib/banking/types";

export const transactionIcons: Record<TransactionType, LucideIcon> = {
  transfer_internal: ArrowLeftRight,
  transfer_bank: Landmark,
  transfer_international: Landmark,
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  card_payment: Wallet,
  admin_adjustment: ShieldCheck,
};

export const transactionLabels: Record<TransactionType, string> = {
  transfer_internal: "Internal transfer",
  transfer_bank: "Bank transfer",
  transfer_international: "International transfer",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  card_payment: "Card payment",
  admin_adjustment: "Admin adjustment",
};

export const statusColors: Record<
  TransactionStatus,
  "warning" | "success" | "destructive" | "secondary"
> = {
  pending: "warning",
  completed: "success",
  failed: "destructive",
  cancelled: "secondary",
};
