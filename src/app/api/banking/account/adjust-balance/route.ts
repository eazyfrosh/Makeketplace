import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { generateReference } from "@/lib/banking/format";
import { createTransaction, getAccountForUser, updateAccount } from "@/lib/banking/store";
import type { Transaction } from "@/lib/banking/types";

interface AdjustBody {
  direction: "credit" | "debit";
  amount: number;
  description: string;
}

/**
 * Self-service demo funds: lets a user top up or draw down their OWN
 * account balance, scoped to caller.uid only — never takes a uid param.
 * This is intentionally a "demo" feature (distinct transaction type from
 * admin_adjustment) for exploring the product without a real payment
 * rail; it can never touch another user's account or balance.
 */
export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AdjustBody | null;
  if (
    !body ||
    !["credit", "debit"].includes(body.direction) ||
    !(body.amount > 0) ||
    !body.description?.trim()
  ) {
    return NextResponse.json(
      { error: "direction (credit/debit), a positive amount, and a description are required." },
      { status: 400 },
    );
  }

  const account = await getAccountForUser(caller.uid);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (account.status !== "active") {
    return NextResponse.json({ error: `Your account is ${account.status}.` }, { status: 400 });
  }

  const newBalance =
    body.direction === "credit"
      ? Math.round((account.balance + body.amount) * 100) / 100
      : Math.round((account.balance - body.amount) * 100) / 100;
  if (newBalance < 0) {
    return NextResponse.json({ error: "This would take your balance negative." }, { status: 400 });
  }

  await updateAccount({ ...account, balance: newBalance });

  const tx: Transaction = {
    id: `btx_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId: caller.uid,
    accountId: account.id,
    type: "demo_adjustment",
    direction: body.direction,
    amount: body.amount,
    currency: account.currency,
    status: "completed",
    reference: generateReference(),
    description: `Demo funds — ${body.description.trim()}`,
    createdAt: new Date().toISOString(),
  };
  await createTransaction(tx);

  return NextResponse.json({ balance: newBalance, transaction: tx });
}
