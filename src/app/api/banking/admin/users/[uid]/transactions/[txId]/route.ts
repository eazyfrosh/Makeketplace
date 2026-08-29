import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getAccountForUser, getTransactionById, updateAccount, updateTransaction } from "@/lib/banking/store";
import type { TransactionStatus } from "@/lib/banking/types";

const VALID_STATUSES: TransactionStatus[] = ["pending", "completed", "failed", "cancelled"];

interface EditBody {
  description?: string;
  counterparty?: string;
  counterpartyAccount?: string;
  recipientBank?: string;
  reference?: string;
  status?: TransactionStatus;
  amount?: number;
  direction?: "credit" | "debit";
}

/**
 * Edits a user's transaction. Editing the amount/direction reconciles the
 * account balance by the exact delta so the balance always matches the sum
 * of transactions, rather than either blocking the edit or letting the two
 * silently drift apart.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string; txId: string }> },
) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { uid, txId } = await params;
  const body = (await request.json().catch(() => null)) as EditBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (body.amount !== undefined && !(body.amount > 0)) {
    return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
  }
  if (body.direction && !["credit", "debit"].includes(body.direction)) {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }

  const tx = await getTransactionById(txId);
  if (!tx || tx.userId !== uid) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  const newAmount = body.amount ?? tx.amount;
  const newDirection = body.direction ?? tx.direction;
  const amountOrDirectionChanged = newAmount !== tx.amount || newDirection !== tx.direction;

  if (amountOrDirectionChanged) {
    const account = await getAccountForUser(uid);
    if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const oldContribution = tx.direction === "credit" ? tx.amount : -tx.amount;
    const newContribution = newDirection === "credit" ? newAmount : -newAmount;
    const newBalance = Math.round((account.balance - oldContribution + newContribution) * 100) / 100;
    if (newBalance < 0) {
      return NextResponse.json({ error: "This change would take the account balance negative." }, { status: 400 });
    }
    await updateAccount({ ...account, balance: newBalance });
  }

  const updated = {
    ...tx,
    description: body.description?.trim() || tx.description,
    counterparty: body.counterparty?.trim() ?? tx.counterparty,
    counterpartyAccount: body.counterpartyAccount?.trim() ?? tx.counterpartyAccount,
    recipientBank: body.recipientBank?.trim() ?? tx.recipientBank,
    reference: body.reference?.trim() || tx.reference,
    status: body.status ?? tx.status,
    amount: newAmount,
    direction: newDirection,
  };
  await updateTransaction(updated);

  return NextResponse.json({ transaction: updated });
}
