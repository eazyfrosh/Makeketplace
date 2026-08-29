import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getOrBootstrapAccount } from "@/lib/banking/bootstrap";
import { getBankingProfile } from "@/lib/banking/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const profile = await getBankingProfile(caller.uid);
  if (!profile?.passwordHash) {
    return NextResponse.json({ error: "No banking account found. Sign up first." }, { status: 404 });
  }

  // Bootstrap kept as a fallback for robustness (e.g. a profile that predates
  // this account/profile split) — registration is what normally creates it.
  const { account, card, transactions } = await getOrBootstrapAccount(
    caller.uid,
    `${profile.firstName ?? caller.email.split("@")[0] ?? "CARDHOLDER"}`,
  );

  return NextResponse.json({
    account,
    card: { ...card, cardNumber: undefined, cvv: undefined, pin: undefined },
    transactions: transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    hasPin: Boolean(profile?.transactionPin),
    profile: { email: profile.email, firstName: profile.firstName, lastName: profile.lastName },
  });
}
