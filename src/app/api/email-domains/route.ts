import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { emailDomainProvider } from "@/lib/email-domains/provider";
import { listEmailDomainsForUser, listSenderIdentities } from "@/lib/email-domains/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [domains, senders] = await Promise.all([listEmailDomainsForUser(caller.uid), listSenderIdentities(caller.uid)]);
  return NextResponse.json({ domains, senders, providerConfigured: emailDomainProvider.isConfigured() });
}
