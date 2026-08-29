export type AccountStatus = "active" | "frozen" | "closed";

export interface Account {
  id: string;
  userId: string;
  type: "current";
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
  isPrimary: boolean;
  status: AccountStatus;
  createdAt: string;
}

export type TransactionType =
  | "transfer_internal"
  | "transfer_bank"
  | "transfer_international"
  | "deposit"
  | "withdrawal"
  | "card_payment"
  | "admin_adjustment"
  | "demo_adjustment";

export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  direction: "credit" | "debit";
  amount: number;
  currency: string;
  status: TransactionStatus;
  reference: string;
  description: string;
  counterparty?: string;
  counterpartyAccount?: string;
  recipientBank?: string;
  fee?: number;
  createdAt: string;
}

export type CardType = "virtual" | "physical";
export type CardNetwork = "visa" | "mastercard" | "verve";
export type CardStatus = "active" | "frozen" | "blocked";

export interface BankCard {
  id: string;
  userId: string;
  accountId: string;
  type: CardType;
  network: CardNetwork;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin: string;
  status: CardStatus;
  dailyLimit: number;
  monthlyLimit: number;
  color: string;
  createdAt: string;
}

/** Server-side only — never returned by any GET route. */
export interface BankingProfile {
  userId: string;
  transactionPin: string | null;
  /** The banking-specific sign-in credential — set once at sign-up, distinct from the Nexova account's own login. Absent until the licensee signs up for banking access. */
  email: string | null;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}
