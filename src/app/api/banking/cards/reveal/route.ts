import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifySecret } from "@/lib/banking/crypto";
import {
  checkAndRecordPinAttempt,
  getBankingProfile,
  getCardForUser,
  resetPinAttempts,
} from "@/lib/banking/store";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const pin = body?.pin as string | undefined;
  if (!pin) return NextResponse.json({ error: "PIN is required." }, { status: 400 });

  const attemptKey = `card-pin:${caller.uid}`;
  const attempt = await checkAndRecordPinAttempt(attemptKey);
  if (!attempt.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const profile = await getBankingProfile(caller.uid);
  if (!profile?.transactionPin) {
    return NextResponse.json({ error: "Set up a transaction PIN first." }, { status: 400 });
  }
  if (!verifySecret(pin, profile.transactionPin)) {
    return NextResponse.json({ error: `Incorrect PIN. ${attempt.remaining} attempts remaining.` }, { status: 401 });
  }
  await resetPinAttempts(attemptKey);

  const card = await getCardForUser(caller.uid);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  return NextResponse.json({ cardNumber: card.cardNumber, cvv: card.cvv, pin: card.pin });
}
