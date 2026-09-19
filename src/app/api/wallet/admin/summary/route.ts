import { NextResponse } from "next/server";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { listAllWalletTransactions, listWallets } from "@/lib/wallet/store";
import { adminDb } from "@/lib/licensing/admin-db";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request); if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    const [wallets, transactions] = await Promise.all([listWallets(), listAllWalletTransactions()]); const now = new Date(); const today = new Date(now); today.setHours(0, 0, 0, 0); const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const db = adminDb;
    const profiles = db ? await Promise.all(wallets.map(async (wallet) => { const snap = await db.collection("users").doc(wallet.userId).get(); const data = snap.data(); return { ...wallet, name: String(data?.name ?? ""), email: String(data?.email ?? "") }; })) : wallets;
    const completed = transactions.filter((t) => t.status === "completed");
    return NextResponse.json({ wallets: profiles, transactions, summary: { walletUsers: wallets.length, totalBalancesMinor: wallets.reduce((s, w) => s + w.balanceMinor, 0), depositsTodayMinor: completed.filter((t) => t.type === "deposit" && new Date(t.createdAt) >= today).reduce((s, t) => s + t.amountMinor, 0), depositsMonthMinor: completed.filter((t) => t.type === "deposit" && new Date(t.createdAt) >= month).reduce((s, t) => s + t.amountMinor, 0), spendingMinor: completed.filter((t) => t.type === "purchase").reduce((s, t) => s + t.amountMinor, 0), refundsMinor: completed.filter((t) => t.type === "refund" || t.type === "reversal").reduce((s, t) => s + t.amountMinor, 0) } });
  } catch (error) { console.error("[wallet admin] summary failed", error); return NextResponse.json({ error: "Unable to load wallet administration." }, { status: 503 }); }
}
