import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifySecret } from "@/lib/banking/crypto";
import { signBankingSession } from "@/lib/banking/session";
import { checkAndRecordPinAttempt, getBankingProfile, resetPinAttempts } from "@/lib/banking/store";

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as LoginBody | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const attemptKey = `banking-login:${caller.uid}`;
  const attempt = await checkAndRecordPinAttempt(attemptKey);
  if (!attempt.allowed) {
    return NextResponse.json(
      { error: "Too many failed sign-in attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const profile = await getBankingProfile(caller.uid);
  if (!profile?.passwordHash || !profile.email) {
    return NextResponse.json({ error: "No banking account found. Sign up first." }, { status: 404 });
  }
  if (profile.email !== email || !verifySecret(password, profile.passwordHash)) {
    return NextResponse.json(
      { error: `Incorrect email or password. ${attempt.remaining} attempts remaining.` },
      { status: 401 },
    );
  }
  await resetPinAttempts(attemptKey);

  const token = await signBankingSession(caller.uid);
  return NextResponse.json({ token });
}
