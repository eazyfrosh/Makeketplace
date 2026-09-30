import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { novaBankRedirectUrl, syncUserToNovaBank } from "@/lib/banking/novabank-sync";

/**
 * Single sign-on handoff: mints a Novaofficial (novabankofficial.app)
 * session for the same email/name a licensee already used to sign up for
 * Nexova's Banking Platform, so "Open in NovaBank" doesn't ask them to
 * create a second identity. The token itself is minted server-to-server by
 * novabankofficial.app's own Admin SDK — this route never touches Firebase
 * credentials for that project directly.
 *
 * Also forwards the current Nexova balance and full transaction history on
 * every handoff, which novabankofficial.app mirrors onto its own account —
 * the two ledgers otherwise have nothing in common, so without this
 * NovaBank always shows whatever it bootstrapped a new account with ($0,
 * no transactions).
 */
export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const result = await syncUserToNovaBank(caller.uid);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ redirectUrl: novaBankRedirectUrl(result.token) });
}
