import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { listWalletTransactions } from "@/lib/wallet/store";
import type { WalletTransactionStatus, WalletTransactionType } from "@/lib/wallet/types";

const TYPES = new Set(["deposit", "purchase", "refund", "adjustment", "reversal"]);
const STATUSES = new Set(["pending", "completed", "failed", "reversed", "refunded"]);

export async function GET(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = new URL(request.url); const rawType = url.searchParams.get("type"); const rawStatus = url.searchParams.get("status");
  const type = rawType && TYPES.has(rawType) ? rawType as WalletTransactionType : undefined;
  const status = rawStatus && STATUSES.has(rawStatus) ? rawStatus as WalletTransactionStatus : undefined;
  try { return NextResponse.json(await listWalletTransactions(caller.uid, { limit: Number(url.searchParams.get("limit")) || 20, cursor: url.searchParams.get("cursor") ?? undefined, type, status })); }
  catch (error) { console.error("[wallet] transaction listing failed", error); return NextResponse.json({ error: "Unable to load transactions." }, { status: 503 }); }
}
