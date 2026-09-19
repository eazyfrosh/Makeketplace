import { NextResponse } from "next/server";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { refundTransaction } from "@/lib/wallet/store";

export async function POST(request: Request) { const admin = await verifyAdminCaller(request); if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 }); const body = await request.json().catch(() => ({})); const transactionId = String(body.transactionId ?? ""); const reason = String(body.reason ?? "").trim(); if (!transactionId || !reason) return NextResponse.json({ error: "Transaction and reason are required." }, { status: 400 }); try { return NextResponse.json({ transaction: await refundTransaction({ transactionId, actorUserId: admin.uid, reason }) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Refund failed." }, { status: 400 }); } }
