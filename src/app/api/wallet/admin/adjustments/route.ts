import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { adjustWallet } from "@/lib/wallet/store";

export async function POST(request: Request) {
  const admin = await verifyAdminCaller(request); if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})); const amountMinor = Number(body.amountMinor); const direction = body.direction === "debit" ? "debit" : body.direction === "credit" ? "credit" : null; const reason = String(body.reason ?? "").trim(); const targetUserId = String(body.targetUserId ?? "").trim();
  if (!targetUserId || !direction || !reason || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) return NextResponse.json({ error: "Target user, direction, amount, and reason are required." }, { status: 400 });
  try { const transaction = await adjustWallet({ adminUserId: admin.uid, targetUserId, amountMinor, direction, reason, reference: `EZT-ADJ-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}` }); return NextResponse.json({ transaction }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Adjustment failed." }, { status: 400 }); }
}
