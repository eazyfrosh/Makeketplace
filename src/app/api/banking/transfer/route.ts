import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { verifySecret } from "@/lib/banking/crypto";
import { generateReference } from "@/lib/banking/format";
import {
  checkAndRecordPinAttempt,
  createTransaction,
  getAccountForUser,
  getBankingProfile,
  resetPinAttempts,
  updateAccount,
} from "@/lib/banking/store";
import type { Transaction } from "@/lib/banking/types";

type TransferKind = "internal" | "bank" | "international";

interface TransferBody {
  kind: TransferKind;
  amount: number;
  pin: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank?: string;
  note?: string;
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TransferBody | null;
  if (
    !body ||
    !["internal", "bank", "international"].includes(body.kind) ||
    !(body.amount > 0) ||
    !body.pin ||
    !body.recipientName ||
    !body.recipientAccount
  ) {
    return NextResponse.json({ error: "Invalid transfer request." }, { status: 400 });
  }

  const account = await getAccountForUser(caller.uid);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (account.status !== "active") {
    return NextResponse.json(
      { error: `Your account is ${account.status}. Unfreeze it before transferring.` },
      { status: 400 },
    );
  }

  const attemptKey = `pin:${caller.uid}`;
  const attempt = await checkAndRecordPinAttempt(attemptKey);
  if (!attempt.allowed) {
    return NextResponse.json(
      { error: "Too many incorrect PIN attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const profile = await getBankingProfile(caller.uid);
  if (!profile?.transactionPin) {
    return NextResponse.json({ error: "Set up a transaction PIN first." }, { status: 400 });
  }
  if (!verifySecret(body.pin, profile.transactionPin)) {
    return NextResponse.json(
      { error: `Incorrect PIN. ${attempt.remaining} attempts remaining.` },
      { status: 401 },
    );
  }
  await resetPinAttempts(attemptKey);

  const fee = body.kind === "international" ? Math.max(5, body.amount * 0.01) : 0;
  const total = body.amount + fee;
  if (account.balance < total) {
    return NextResponse.json({ error: "Insufficient balance." }, { status: 400 });
  }

  const status: Transaction["status"] = body.kind === "internal" ? "completed" : "pending";
  const reference = generateReference();

  await updateAccount({ ...account, balance: Math.round((account.balance - total) * 100) / 100 });

  const tx: Transaction = {
    id: `btx_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId: caller.uid,
    accountId: account.id,
    type: `transfer_${body.kind}`,
    direction: "debit",
    amount: body.amount,
    currency: account.currency,
    status,
    reference,
    description: body.note || `Transfer to ${body.recipientName}`,
    counterparty: body.recipientName,
    counterpartyAccount: body.recipientAccount,
    recipientBank: body.recipientBank,
    fee,
    createdAt: new Date().toISOString(),
  };
  await createTransaction(tx);

  return NextResponse.json({ reference, status, fee });
}
