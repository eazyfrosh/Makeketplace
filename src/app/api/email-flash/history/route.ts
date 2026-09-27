import { NextResponse } from "next/server";

import { requireReceiptEmailAccess } from "@/lib/receipt-email/access";
import { listReceiptSends } from "@/lib/receipt-email/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await requireReceiptEmailAccess(caller);
    return NextResponse.json({ sends: await listReceiptSends(caller.uid) });
  } catch (error) {
    console.error("[email-designer] history failed", error);
    return NextResponse.json({ error: "Send history is temporarily unavailable." }, { status: 503 });
  }
}
