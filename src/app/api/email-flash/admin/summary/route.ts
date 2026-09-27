import { NextResponse } from "next/server";

import { getReceiptEmailAdminSummary } from "@/lib/receipt-email/store";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    return NextResponse.json(await getReceiptEmailAdminSummary());
  } catch (error) {
    console.error("[email-flash] admin summary failed", error);
    return NextResponse.json({ error: "Email Flash usage is temporarily unavailable." }, { status: 503 });
  }
}
