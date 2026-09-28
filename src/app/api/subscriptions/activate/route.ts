import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { activateSubscription } from "@/lib/subscriptions/server";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const reference = String(body?.reference ?? "");
  if (!reference) return NextResponse.json({ error: "Missing subscription payment reference." }, { status: 400 });
  try {
    const result = await activateSubscription({ userId: caller.uid, reference });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Subscription activation failed." }, { status: 402 });
  }
}
