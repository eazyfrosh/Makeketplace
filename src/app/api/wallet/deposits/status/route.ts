import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getFundingIntent } from "@/lib/wallet/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const reference = new URL(request.url).searchParams.get("reference") ?? "";
  try { const intent = await getFundingIntent(reference); if (!intent || intent.userId !== caller.uid) return NextResponse.json({ error: "Funding request not found." }, { status: 404 }); return NextResponse.json({ status: intent.status, amountMinor: intent.amountMinor, transactionId: intent.transactionId }); }
  catch { return NextResponse.json({ error: "Unable to check funding status." }, { status: 503 }); }
}
