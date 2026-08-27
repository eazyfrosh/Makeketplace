import { generateAccountNumber, generateReference } from "@/lib/banking/format";
import {
  createAccount,
  createCard,
  createTransaction,
  getAccountForUser,
  getCardForUser,
  getTransactionsForUser,
} from "@/lib/banking/store";
import type { Account, BankCard, Transaction } from "@/lib/banking/types";

function randomCardNumber() {
  return `4${Math.floor(100000000000000 + Math.random() * 899999999999999)}`;
}

function randomCvv() {
  return String(Math.floor(100 + Math.random() * 899));
}

/**
 * Creates a new licensee's starting state on first visit: one current
 * account, one virtual card, and a handful of seed transactions — mirrors
 * Novaofficial's own onboarding.ts (welcome bonus, salary, a couple of
 * spends) so the dashboard isn't empty on day one. Idempotent: a second
 * call for a user who already has an account is a no-op.
 */
export async function getOrBootstrapAccount(
  userId: string,
  cardholderName: string,
): Promise<{ account: Account; card: BankCard; transactions: Transaction[] }> {
  const existing = await getAccountForUser(userId);
  if (existing) {
    const [card, transactions] = await Promise.all([
      getCardForUser(userId),
      getTransactionsForUser(userId),
    ]);
    return { account: existing, card: card!, transactions };
  }

  const now = new Date();
  const accountId = `bacc_${userId}`;

  const seed: { desc: string; amount: number; type: Transaction["type"]; direction: "credit" | "debit" }[] = [
    { desc: "Welcome bonus", amount: 50, type: "deposit", direction: "credit" },
    { desc: "Salary deposit", amount: 3200, type: "deposit", direction: "credit" },
    { desc: "Grocery Mart", amount: 84.32, type: "card_payment", direction: "debit" },
    { desc: "Electric Co. bill", amount: 120.5, type: "withdrawal", direction: "debit" },
  ];
  const startingBalance = seed.reduce(
    (sum, s) => sum + (s.direction === "credit" ? s.amount : -s.amount),
    0,
  );

  const account: Account = {
    id: accountId,
    userId,
    type: "current",
    name: "Current Account",
    accountNumber: generateAccountNumber(),
    balance: Math.round(startingBalance * 100) / 100,
    currency: "USD",
    isPrimary: true,
    status: "active",
    createdAt: now.toISOString(),
  };

  const card: BankCard = {
    id: `bcard_${userId}`,
    userId,
    accountId,
    type: "virtual",
    network: "visa",
    cardholderName: cardholderName.toUpperCase(),
    cardNumber: randomCardNumber(),
    expiryMonth: "12",
    expiryYear: String(now.getFullYear() + 4),
    cvv: randomCvv(),
    pin: "1234",
    status: "active",
    dailyLimit: 2000,
    monthlyLimit: 20000,
    color: "from-indigo-600 to-violet-600",
    createdAt: now.toISOString(),
  };

  const transactions: Transaction[] = seed.map((s, i) => ({
    id: `btx_${userId}_seed_${i}`,
    userId,
    accountId,
    type: s.type,
    direction: s.direction,
    amount: s.amount,
    currency: "USD",
    status: "completed",
    reference: generateReference(),
    description: s.desc,
    createdAt: new Date(now.getTime() - (seed.length - i) * 86_400_000).toISOString(),
  }));

  await createAccount(account);
  await createCard(card);
  await Promise.all(transactions.map((tx) => createTransaction(tx)));

  return { account, card, transactions };
}
