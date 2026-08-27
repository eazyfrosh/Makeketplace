import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { hashSecret } from "@/lib/banking/crypto";
import { getBankingProfile, setBankingProfile } from "@/lib/banking/store";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pin = body?.pin as string | undefined;
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const existing = await getBankingProfile(caller.uid);
  await setBankingProfile({
    userId: caller.uid,
    transactionPin: hashSecret(pin),
    email: existing?.email ?? null,
    passwordHash: existing?.passwordHash ?? null,
    firstName: existing?.firstName ?? null,
    lastName: existing?.lastName ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true });
}
