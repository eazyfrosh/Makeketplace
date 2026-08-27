import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getBankingProfile } from "@/lib/banking/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await getBankingProfile(caller.uid);
  const hasAccount = Boolean(profile?.passwordHash);
  const sessionValid = hasAccount && (await verifyBankingSession(request, caller.uid));

  return NextResponse.json({ hasAccount, sessionValid });
}
