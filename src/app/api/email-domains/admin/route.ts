import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getDomain } from "@/lib/domains/store";
import { getEmailDomain, listAllSenderIdentities, listEmailDomains, setEmailDomainSuspension } from "@/lib/email-domains/store";
import { provisionEmailDomain } from "@/lib/email-domains/provisioning";
import { listDomainOrders } from "@/lib/domains/store";

export async function GET(request: Request) { const admin = await verifyAdminCaller(request); if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 }); const [domains, senders, orders] = await Promise.all([listEmailDomains(), listAllSenderIdentities(), listDomainOrders()]); return NextResponse.json({ domains: domains.map((domain) => { const order = orders.find((item) => item.userId === domain.userId && item.domain === domain.domain); return { ...domain, paymentStatus: order?.paymentStatus ?? "unknown", registrationStatus: order?.registrationStatus ?? "unknown", refundState: order?.refundState ?? "not_required", senders: senders.filter((sender) => sender.emailDomainId === domain.id).map((sender) => sender.address) }; }) }); }

const actionSchema = z.object({ id: z.string().min(1), action: z.enum(["retry", "suspend", "restore"]), reason: z.string().trim().max(500).default("") });
export async function PATCH(request: Request) {
  const admin = await verifyAdminCaller(request); if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  const emailDomain = await getEmailDomain(parsed.data.id); if (!emailDomain) return NextResponse.json({ error: "Email domain not found." }, { status: 404 });
  if (parsed.data.action === "retry") { const domain = await getDomain(emailDomain.domainId); if (!domain) return NextResponse.json({ error: "Registered domain not found." }, { status: 404 }); try { return NextResponse.json({ emailDomain: await provisionEmailDomain(domain) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Retry failed." }, { status: 502 }); } }
  if (parsed.data.action === "suspend" && !parsed.data.reason) return NextResponse.json({ error: "A suspension reason is required." }, { status: 400 });
  await setEmailDomainSuspension(emailDomain.id, parsed.data.action === "suspend", parsed.data.reason, admin.uid);
  return NextResponse.json({ updated: true });
}
