import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getFundingIntent } from "@/lib/wallet/store";
import { reconcileWalletDeposit } from "@/lib/wallet/reconcile";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const reference = new URL(request.url).searchParams.get("reference") ?? "";
  try {
    let intent = await getFundingIntent(reference);
    if (!intent || intent.userId !== caller.uid) return NextResponse.json({ error: "Funding request not found." }, { status: 404 });
    if (intent.status === "pending") intent = await reconcileWalletDeposit(reference, caller.uid) ?? intent;
    return NextResponse.json({ status: intent.status, amountMinor: intent.amountMinor, transactionId: intent.transactionId });
  }
  catch { return NextResponse.json({ error: "Unable to check funding status." }, { status: 503 }); }
}
