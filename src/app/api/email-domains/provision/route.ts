import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getDomain } from "@/lib/domains/store";
import { isResellerClubConfigured } from "@/lib/resellerclub";
import { emailDomainProvider } from "@/lib/email-domains/provider";
import { provisionEmailDomain } from "@/lib/email-domains/provisioning";

const schema = z.object({ domainId: z.string().min(1).max(180) });
export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid domain is required." }, { status: 400 });
  const domain = await getDomain(parsed.data.domainId);
  if (!domain || domain.userId !== caller.uid) return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  if (!isResellerClubConfigured()) return NextResponse.json({ error: "Domain service is being configured. Please try again later.", code: "PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  if (!emailDomainProvider.isConfigured()) return NextResponse.json({ error: "Email-domain service is being configured. Please try again later.", code: "EMAIL_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  try { return NextResponse.json({ emailDomain: await provisionEmailDomain(domain) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Email setup failed." }, { status: 502 }); }
}
