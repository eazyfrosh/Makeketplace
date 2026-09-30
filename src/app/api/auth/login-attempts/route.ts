import { NextResponse } from "next/server";
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/auth-security/login-lockout";
import { verifyCaller } from "@/lib/licensing/verify-auth";

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !validEmail(body.email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const email = body.email.trim().toLowerCase();
  try {
    if (body.action === "success") {
      const caller = await verifyCaller(request);
      if (!caller || caller.email.toLowerCase() !== email) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      await clearLoginFailures(email);
      return NextResponse.json({ ok: true });
    }
    const result = body.action === "failure" ? await recordLoginFailure(email) : await checkLoginAllowed(email);
    if (!result.allowed) return NextResponse.json({ error: "Too many unsuccessful login attempts. Try again in 30 minutes.", retryAfterSeconds: result.retryAfterSeconds }, { status: 429 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[auth/login-attempts]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Login protection is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
