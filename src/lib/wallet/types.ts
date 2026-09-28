export type WalletCurrency = "NGN";
export type WalletTransactionType = "deposit" | "purchase" | "refund" | "adjustment" | "reversal";
export type WalletDirection = "credit" | "debit";
export type WalletTransactionStatus = "pending" | "completed" | "failed" | "reversed" | "refunded";

export interface Wallet {
  userId: string;
  currency: WalletCurrency;
  balanceMinor: number;
  totalDepositedMinor: number;
  totalSpentMinor: number;
  dailyFundingDate?: string;
  dailyFundingMinor?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amountMinor: number;
  currency: WalletCurrency;
  direction: WalletDirection;
  status: WalletTransactionStatus;
  description: string;
  reference: string;
  provider: string | null;
  providerReference: string | null;
  serviceType: string | null;
  serviceId: string | null;
  relatedTransactionId: string | null;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
}

export interface WalletFundingIntent {
  id: string;
  userId: string;
  email: string;
  amountMinor: number;
  currency: WalletCurrency;
  purpose: "wallet_topup";
  reference: string;
  status: "pending" | "completed" | "failed";
  provider: "paystack";
  providerReference: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}
