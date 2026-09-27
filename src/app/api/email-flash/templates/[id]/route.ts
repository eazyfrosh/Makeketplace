import { NextResponse } from "next/server";

import { requireReceiptEmailAccess } from "@/lib/receipt-email/access";
import { deleteReceiptTemplate, getReceiptTemplate, logReceiptEmailAudit, saveReceiptTemplate } from "@/lib/receipt-email/store";
import { receiptTemplateInputSchema } from "@/lib/receipt-email/validation";
import { verifyCaller } from "@/lib/licensing/verify-auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await requireReceiptEmailAccess(caller);
    const { id } = await context.params;
    const current = await getReceiptTemplate(id);
    if (!current || current.userId !== caller.uid) return NextResponse.json({ error: "Template not found." }, { status: 404 });
    const parsed = receiptTemplateInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid template." }, { status: 400 });
    const template = { ...current, ...parsed.data, id, userId: caller.uid, updatedAt: new Date().toISOString() };
    await saveReceiptTemplate(template);
    await logReceiptEmailAudit({ actorId: caller.uid, action: "template.updated", targetId: id });
    return NextResponse.json({ template });
  } catch (error) {
    console.error("[email-flash] template update failed", error);
    return NextResponse.json({ error: "Template could not be updated." }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await requireReceiptEmailAccess(caller);
    const { id } = await context.params;
    await deleteReceiptTemplate(id, caller.uid);
    await logReceiptEmailAudit({ actorId: caller.uid, action: "template.deleted", targetId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[email-flash] template delete failed", error);
    return NextResponse.json({ error: "Template could not be deleted." }, { status: 400 });
  }
}
