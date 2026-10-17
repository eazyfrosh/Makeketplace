import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { publicWalletLimits } from "@/lib/wallet/config";
import { reconcileWalletDeposit } from "@/lib/wallet/reconcile";
import { getOrCreateWallet, listPendingFundingIntents, listWalletTransactions } from "@/lib/wallet/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const pending = await listPendingFundingIntents(caller.uid, 10);
    await Promise.allSettled(pending.map((intent) => reconcileWalletDeposit(intent.reference, caller.uid)));
    const [wallet, recent] = await Promise.all([getOrCreateWallet(caller.uid), listWalletTransactions(caller.uid, { limit: 5 })]);
    return NextResponse.json({ wallet, recentTransactions: recent.transactions, limits: publicWalletLimits() });
  } catch (error) {
    console.error("[wallet] read failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Wallet is unavailable." }, { status: 503 });
  }
}
