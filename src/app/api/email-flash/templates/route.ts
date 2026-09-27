import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireReceiptEmailAccess } from "@/lib/receipt-email/access";
import { listReceiptTemplates, logReceiptEmailAudit, saveReceiptTemplate } from "@/lib/receipt-email/store";
import { receiptTemplateInputSchema } from "@/lib/receipt-email/validation";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await requireReceiptEmailAccess(caller);
    return NextResponse.json({ templates: await listReceiptTemplates(caller.uid) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "ACTIVE_SUBSCRIPTION_REQUIRED" ? "An active subscription is required for Email Designer." : "Designs are temporarily unavailable." }, { status: error instanceof Error && error.message === "ACTIVE_SUBSCRIPTION_REQUIRED" ? 403 : 503 });
  }
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await requireReceiptEmailAccess(caller);
    const parsed = receiptTemplateInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid template." }, { status: 400 });
    const now = new Date().toISOString();
    const template = { ...parsed.data, schemaVersion: 2 as const, id: `edt_${randomUUID()}`, userId: caller.uid, createdAt: now, updatedAt: now };
    await saveReceiptTemplate(template);
    await logReceiptEmailAudit({ actorId: caller.uid, action: "template.created", targetId: template.id });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("[email-designer] template create failed", error);
    return NextResponse.json({ error: error instanceof Error && error.message === "ACTIVE_SUBSCRIPTION_REQUIRED" ? "An active subscription is required for Email Designer." : "Template could not be saved." }, { status: error instanceof Error && error.message === "ACTIVE_SUBSCRIPTION_REQUIRED" ? 403 : 503 });
  }
}
