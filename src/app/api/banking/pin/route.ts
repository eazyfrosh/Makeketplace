import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { hashSecret, verifySecret } from "@/lib/banking/crypto";
import { checkAndRecordPinAttempt, getBankingProfile, resetPinAttempts, setBankingProfile } from "@/lib/banking/store";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pin = body?.pin as string | undefined;
  const currentPin = body?.currentPin as string | undefined;
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const existing = await getBankingProfile(caller.uid);

  // Changing an already-set PIN requires proving the current one first — a
  // banking session token alone shouldn't be enough to silently replace it.
  // First-time setup (no PIN yet) skips this; that's what admin's PIN reset
  // is for when a user genuinely forgets theirs.
  if (existing?.transactionPin) {
    const attemptKey = `pin-change:${caller.uid}`;
    const attempt = await checkAndRecordPinAttempt(attemptKey);
    if (!attempt.allowed) {
      return NextResponse.json(
        { error: "Too many incorrect PIN attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    }
    if (!currentPin || !verifySecret(currentPin, existing.transactionPin)) {
      return NextResponse.json(
        { error: `Current PIN is incorrect. ${attempt.remaining} attempts remaining.` },
        { status: 401 },
      );
    }
    await resetPinAttempts(attemptKey);
  }

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
