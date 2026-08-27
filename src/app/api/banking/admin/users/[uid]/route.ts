import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getAccountForUser, getBankingProfile, getCardForUser, getTransactionsForUser } from "@/lib/banking/store";

export async function GET(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { uid } = await params;
  const profile = await getBankingProfile(uid);
  if (!profile?.passwordHash) {
    return NextResponse.json({ error: "No banking account found for this user." }, { status: 404 });
  }

  const [account, card, transactions] = await Promise.all([
    getAccountForUser(uid),
    getCardForUser(uid),
    getTransactionsForUser(uid),
  ]);

  return NextResponse.json({
    profile: {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      createdAt: profile.createdAt,
    },
    account,
    // Card secrets stay behind the customer's own PIN-verified reveal flow —
    // support access doesn't need (and shouldn't get) the raw number/cvv/pin.
    card: card ? { ...card, cardNumber: undefined, cvv: undefined, pin: undefined } : null,
    transactions: transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}
