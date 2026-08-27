import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { hashSecret } from "@/lib/banking/crypto";
import { signBankingSession } from "@/lib/banking/session";
import { getBankingProfile, setBankingProfile } from "@/lib/banking/store";
import { getOrBootstrapAccount } from "@/lib/banking/bootstrap";

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as RegisterBody | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const firstName = body?.firstName?.trim();
  const lastName = body?.lastName?.trim();

  if (!email || !email.includes("@") || !password || password.length < 8 || !firstName || !lastName) {
    return NextResponse.json(
      { error: "Enter a valid email, a password of at least 8 characters, and your name." },
      { status: 400 },
    );
  }

  const existing = await getBankingProfile(caller.uid);
  if (existing?.passwordHash) {
    return NextResponse.json({ error: "A banking account already exists for this user." }, { status: 409 });
  }

  const now = new Date().toISOString();
  await setBankingProfile({
    userId: caller.uid,
    transactionPin: existing?.transactionPin ?? null,
    email,
    passwordHash: hashSecret(password),
    firstName,
    lastName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  await getOrBootstrapAccount(caller.uid, `${firstName} ${lastName}`);

  const token = await signBankingSession(caller.uid);
  return NextResponse.json({ token });
}
