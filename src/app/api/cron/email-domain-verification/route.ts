import { NextResponse } from "next/server";
import { listEmailDomains } from "@/lib/email-domains/store";
import { checkEmailDomainVerification } from "@/lib/email-domains/provisioning";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const pending = (await listEmailDomains()).filter((domain) => ["setting_up", "verifying"].includes(domain.status) && !domain.suspended).slice(0, 25);
  const results = await Promise.allSettled(pending.map(checkEmailDomainVerification));
  return NextResponse.json({ checked: results.length, ready: results.filter((result) => result.status === "fulfilled" && result.value.status === "ready").length, failed: results.filter((result) => result.status === "rejected").length });
}
