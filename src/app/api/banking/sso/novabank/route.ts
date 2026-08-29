import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getBankingProfile } from "@/lib/banking/store";

const NOVABANK_APP_URL = "https://novabankofficial.app";

/**
 * Single sign-on handoff: mints a Novaofficial (novabankofficial.app)
 * session for the same email/name a licensee already used to sign up for
 * Nexova's Banking Platform, so "Open in NovaBank" doesn't ask them to
 * create a second identity. The token itself is minted server-to-server by
 * novabankofficial.app's own Admin SDK — this route never touches Firebase
 * credentials for that project directly.
 */
export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const sharedSecret = process.env.NOVABANK_SSO_SHARED_SECRET;
  if (!sharedSecret) {
    return NextResponse.json({ error: "NovaBank single sign-on is not configured." }, { status: 501 });
  }

  const profile = await getBankingProfile(caller.uid);
  if (!profile?.email || !profile.firstName || !profile.lastName) {
    return NextResponse.json({ error: "Complete your Banking Platform sign-up first." }, { status: 400 });
  }

  let token: string;
  try {
    const res = await fetch(`${NOVABANK_APP_URL}/api/sso/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sso-secret": sharedSecret },
      body: JSON.stringify({ email: profile.email, firstName: profile.firstName, lastName: profile.lastName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      console.error("[banking/sso/novabank] provision failed:", res.status, data);
      return NextResponse.json({ error: data.error ?? "NovaBank could not provision your account." }, { status: 502 });
    }
    token = data.token;
  } catch (err) {
    console.error("[banking/sso/novabank] request to novabankofficial.app failed:", err);
    return NextResponse.json({ error: "Could not reach NovaBank right now." }, { status: 502 });
  }

  return NextResponse.json({ redirectUrl: `${NOVABANK_APP_URL}/sso?token=${encodeURIComponent(token)}` });
}
