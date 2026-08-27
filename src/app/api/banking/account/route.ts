import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getOrBootstrapAccount } from "@/lib/banking/bootstrap";
import { getBankingProfile } from "@/lib/banking/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { account, card, transactions } = await getOrBootstrapAccount(
    caller.uid,
    caller.email.split("@")[0] || "CARDHOLDER",
  );
  const profile = await getBankingProfile(caller.uid);

  return NextResponse.json({
    account,
    card: { ...card, cardNumber: undefined, cvv: undefined, pin: undefined },
    transactions: transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    hasPin: Boolean(profile?.transactionPin),
  });
}
