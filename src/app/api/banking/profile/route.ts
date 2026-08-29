import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getBankingProfile, setBankingProfile } from "@/lib/banking/store";

interface UpdateBody {
  firstName?: string;
  lastName?: string;
}

/**
 * Self-service edit of the caller's own banking profile name — scoped to
 * caller.uid only. Email/password stay out of this route: changing the
 * banking sign-in email or password is a bigger identity change than a
 * display-name edit and isn't handled here.
 */
export async function PATCH(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  const firstName = body?.firstName?.trim();
  const lastName = body?.lastName?.trim();
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }

  const existing = await getBankingProfile(caller.uid);
  if (!existing?.passwordHash) {
    return NextResponse.json({ error: "No banking account found. Sign up first." }, { status: 404 });
  }

  await setBankingProfile({ ...existing, firstName, lastName, updatedAt: new Date().toISOString() });
  return NextResponse.json({ firstName, lastName });
}
