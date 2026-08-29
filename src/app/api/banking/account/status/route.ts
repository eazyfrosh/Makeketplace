import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getAccountForUser, updateAccount } from "@/lib/banking/store";
import type { AccountStatus } from "@/lib/banking/types";

/**
 * Self-service freeze/unfreeze of the caller's own account — the customer
 * equivalent of the admin account-status action, scoped to caller.uid only
 * (never takes a uid param). Closing an account stays admin-only.
 */
export async function PATCH(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status as AccountStatus | undefined;
  if (status !== "active" && status !== "frozen") {
    return NextResponse.json({ error: "status must be active or frozen." }, { status: 400 });
  }

  const account = await getAccountForUser(caller.uid);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (account.status === "closed") {
    return NextResponse.json({ error: "This account is closed. Contact support." }, { status: 400 });
  }

  await updateAccount({ ...account, status });
  return NextResponse.json({ status });
}
