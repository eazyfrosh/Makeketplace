import "server-only";

import { getAccountForUser, getBankingProfile, getTransactionsForUser } from "@/lib/banking/store";
import type { TransactionType } from "@/lib/banking/types";

const NOVABANK_APP_URL = "https://novabankofficial.app";

function toNovabankType(type: TransactionType, direction: "credit" | "debit"): string {
  if (type === "admin_adjustment" || type === "demo_adjustment") {
    return direction === "credit" ? "deposit" : "withdrawal";
  }
  return type;
}

export type NovaBankSyncResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

/**
 * Copies the authoritative EazyTool banking balance and ledger to the
 * corresponding NovaBank identity. The target identity is resolved from the
 * server-side banking profile; callers cannot supply an email or NovaBank UID.
 */
export async function syncUserToNovaBank(userId: string): Promise<NovaBankSyncResult> {
  const sharedSecret = process.env.NOVABANK_SSO_SHARED_SECRET;
  if (!sharedSecret) return { ok: false, error: "NovaBank synchronization is not configured." };

  const profile = await getBankingProfile(userId);
  if (!profile?.email || !profile.firstName || !profile.lastName) {
    return { ok: false, error: "The user must complete Banking Platform sign-up first." };
  }

  const [account, transactions] = await Promise.all([
    getAccountForUser(userId),
    getTransactionsForUser(userId),
  ]);
  if (!account) return { ok: false, error: "The user's banking account could not be found." };

  try {
    const response = await fetch(`${NOVABANK_APP_URL}/api/sso/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sso-secret": sharedSecret,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        balance: account.balance,
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          type: toNovabankType(transaction.type, transaction.direction),
          direction: transaction.direction,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          reference: transaction.reference,
          description: transaction.description,
          counterparty: transaction.counterparty,
          counterpartyAccount: transaction.counterpartyAccount,
          recipientBank: transaction.recipientBank,
          fee: transaction.fee,
          createdAt: transaction.createdAt,
        })),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      console.error("[banking/novabank-sync] provision failed", response.status, data.error);
      return { ok: false, error: data.error ?? "NovaBank could not update this account." };
    }
    return { ok: true, token: data.token };
  } catch (error) {
    console.error("[banking/novabank-sync] request failed", error);
    return { ok: false, error: "NovaBank could not be reached right now." };
  }
}

export function novaBankRedirectUrl(token: string) {
  return `${NOVABANK_APP_URL}/sso?token=${encodeURIComponent(token)}`;
}
