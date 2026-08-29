import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { generateReference } from "@/lib/banking/format";
import { createTransaction, getAccountForUser, updateAccount } from "@/lib/banking/store";
import type { Transaction } from "@/lib/banking/types";

interface AdjustBody {
  direction: "credit" | "debit";
  amount: number;
  description: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { uid } = await params;
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

  const account = await getAccountForUser(uid);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const newBalance =
    body.direction === "credit"
      ? Math.round((account.balance + body.amount) * 100) / 100
      : Math.round((account.balance - body.amount) * 100) / 100;
  if (newBalance < 0) {
    return NextResponse.json({ error: "This would take the account balance negative." }, { status: 400 });
  }

  await updateAccount({ ...account, balance: newBalance });

  const tx: Transaction = {
    id: `btx_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId: uid,
    accountId: account.id,
    type: "admin_adjustment",
    direction: body.direction,
    amount: body.amount,
    currency: account.currency,
    status: "completed",
    reference: generateReference(),
    description: `Admin adjustment — ${body.description.trim()}`,
    createdAt: new Date().toISOString(),
  };
  await createTransaction(tx);

  return NextResponse.json({ balance: newBalance, transaction: tx });
}
