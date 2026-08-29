import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getAccountForUser, getBankingProfile, getTransactionsForUser } from "@/lib/banking/store";
import type { TransactionType } from "@/lib/banking/types";

const NOVABANK_APP_URL = "https://novabankofficial.app";

/**
 * novabankofficial.app's own TransactionType union doesn't know
 * "admin_adjustment"/"demo_adjustment" — those are Nexova-specific labels
 * for something that, from NovaBank's side, is just a deposit or
 * withdrawal. The distinguishing context ("Admin adjustment — ...",
 * "Demo funds — ...") already lives in the description text either way.
 */
function toNovabankType(type: TransactionType, direction: "credit" | "debit"): string {
  if (type === "admin_adjustment" || type === "demo_adjustment") {
    return direction === "credit" ? "deposit" : "withdrawal";
  }
  return type;
}

/**
 * Single sign-on handoff: mints a Novaofficial (novabankofficial.app)
 * session for the same email/name a licensee already used to sign up for
 * Nexova's Banking Platform, so "Open in NovaBank" doesn't ask them to
 * create a second identity. The token itself is minted server-to-server by
 * novabankofficial.app's own Admin SDK — this route never touches Firebase
 * credentials for that project directly.
 *
 * Also forwards the current Nexova balance and full transaction history on
 * every handoff, which novabankofficial.app mirrors onto its own account —
 * the two ledgers otherwise have nothing in common, so without this
 * NovaBank always shows whatever it bootstrapped a new account with ($0,
 * no transactions).
 */
export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const sharedSecret = process.env.NOVABANK_SSO_SHARED_SECRET;
  if (!sharedSecret) {
    return NextResponse.json({ error: "NovaBank single sign-on is not configured." }, { status: 501 });
  }

  const profile = await getBankingProfile(caller.uid);
  if (!profile?.email || !profile.firstName || !profile.lastName) {
    return NextResponse.json({ error: "Complete your Banking Platform sign-up first." }, { status: 400 });
  }
  const account = await getAccountForUser(caller.uid);
  const transactions = await getTransactionsForUser(caller.uid);

  let token: string;
  try {
    const res = await fetch(`${NOVABANK_APP_URL}/api/sso/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sso-secret": sharedSecret },
      body: JSON.stringify({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        balance: account?.balance,
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: toNovabankType(tx.type, tx.direction),
          direction: tx.direction,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          reference: tx.reference,
          description: tx.description,
          counterparty: tx.counterparty,
          counterpartyAccount: tx.counterpartyAccount,
          recipientBank: tx.recipientBank,
          fee: tx.fee,
          createdAt: tx.createdAt,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      console.error("[banking/sso/novabank] provision failed:", res.status, data);
      return NextResponse.json({ error: data.error ?? "NovaBank could not provision your account." }, { status: 502 });
    }
    token = data.token;
  } catch (err) {
    console.error("[banking/sso/novabank] request to novabankofficial.app failed:", err);
    return NextResponse.json({ error: "Could not reach NovaBank right now." }, { status: 502 });
  }

  return NextResponse.json({ redirectUrl: `${NOVABANK_APP_URL}/sso?token=${encodeURIComponent(token)}` });
}
