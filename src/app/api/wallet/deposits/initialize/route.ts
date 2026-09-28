import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { walletLimits } from "@/lib/wallet/config";
import { createFundingIntent, failFundingIntent, getDailyCompletedDeposits, getOrCreateWallet } from "@/lib/wallet/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Wallet funding is not configured. Add PAYSTACK_SECRET_KEY in Vercel." }, { status: 503 });
  const body = await request.json().catch(() => ({})); const amountMinor = Number(body.amountMinor);
  if (!Number.isSafeInteger(amountMinor) || amountMinor < walletLimits.minimumDepositMinor || amountMinor > walletLimits.maximumSingleDepositMinor) return NextResponse.json({ error: "Deposit amount is outside the allowed limits." }, { status: 400 });
  try {
    const [wallet, daily] = await Promise.all([getOrCreateWallet(caller.uid), getDailyCompletedDeposits(caller.uid)]);
    if (daily + amountMinor > walletLimits.maximumDailyFundingMinor) return NextResponse.json({ error: "This deposit would exceed your daily funding limit." }, { status: 400 });
    if (wallet.balanceMinor + amountMinor > walletLimits.maximumWalletBalanceMinor) return NextResponse.json({ error: "This deposit would exceed your maximum wallet balance." }, { status: 400 });
    const reference = `EZT-WAL-${Date.now()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    await createFundingIntent({ userId: caller.uid, email: caller.email, amountMinor, reference });
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: caller.email, amount: amountMinor, currency: "NGN", reference, callback_url: `${origin}/wallet?funding=processing&reference=${encodeURIComponent(reference)}`, metadata: { purpose: "wallet_topup", userId: caller.uid, walletReference: reference } }) });
    const payload = await response.json().catch(() => null) as { data?: { authorization_url?: string; access_code?: string } } | null;
    if (!response.ok || !payload?.data?.authorization_url) { await failFundingIntent(reference); return NextResponse.json({ error: "Unable to start Paystack checkout." }, { status: 502 }); }
    return NextResponse.json({ authorizationUrl: payload.data.authorization_url, accessCode: payload.data.access_code, reference });
  } catch (error) { console.error("[wallet] deposit initialization failed", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start wallet funding." }, { status: 503 }); }
}
