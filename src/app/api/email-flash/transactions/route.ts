import { NextResponse } from "next/server";

import { requireReceiptEmailAccess } from "@/lib/receipt-email/access";
import { listReceiptTransactions } from "@/lib/receipt-email/transactions";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await requireReceiptEmailAccess(caller);
    return NextResponse.json({ transactions: await listReceiptTransactions(caller.uid) });
  } catch (error) {
    console.error("[email-flash] transactions failed", error);
    return NextResponse.json({ error: "Transactions are temporarily unavailable." }, { status: 503 });
  }
}
