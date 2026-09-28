import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmailDomainForUser, createSenderIdentity, logEmailDomainAudit } from "@/lib/email-domains/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";

const schema = z.object({
  emailDomainId: z.string().min(1).max(160),
  localPart: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/, "Enter a valid address name."),
  displayName: z.string().trim().min(1).max(120),
  replyTo: z.string().trim().toLowerCase().email().max(254),
  isDefault: z.boolean().default(false),
});

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid sender." }, { status: 400 });
  const emailDomain = await getEmailDomainForUser(parsed.data.emailDomainId, caller.uid);
  if (!emailDomain || emailDomain.status !== "ready" || emailDomain.suspended) return NextResponse.json({ error: "The domain must be verified and active before creating a sender." }, { status: 409 });
  const now = new Date().toISOString();
  const sender = { id: `sender_${randomUUID()}`, userId: caller.uid, domainId: emailDomain.domainId, emailDomainId: emailDomain.id, domain: emailDomain.domain, localPart: parsed.data.localPart, address: `${parsed.data.localPart}@${emailDomain.domain}`, displayName: parsed.data.displayName, replyTo: parsed.data.replyTo, isDefault: parsed.data.isDefault, enabled: true, createdAt: now, updatedAt: now };
  try { await createSenderIdentity(sender); await logEmailDomainAudit({ actorId: caller.uid, action: "sender.created", targetId: sender.id, domainId: sender.domainId }); return NextResponse.json({ sender }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "EMAIL_DOMAIN_NOT_READY" ? "The domain is not ready for email." : "Sender address could not be created." }, { status: 409 }); }
}
