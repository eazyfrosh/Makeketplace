import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getWalletTransaction } from "@/lib/wallet/store";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  try { const transaction = await getWalletTransaction(id); if (!transaction || (transaction.userId !== caller.uid && caller.role !== "admin")) return NextResponse.json({ error: "Transaction not found." }, { status: 404 }); return NextResponse.json({ transaction }); }
  catch { return NextResponse.json({ error: "Unable to load transaction." }, { status: 503 }); }
}
