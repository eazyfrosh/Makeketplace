import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getAccountForUser, updateAccount } from "@/lib/banking/store";
import type { AccountStatus } from "@/lib/banking/types";

const VALID_STATUSES: AccountStatus[] = ["active", "frozen", "closed"];

export async function PATCH(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { uid } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as AccountStatus | undefined;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "status must be one of: active, frozen, closed." }, { status: 400 });
  }

  const account = await getAccountForUser(uid);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  await updateAccount({ ...account, status });
  return NextResponse.json({ status });
}
