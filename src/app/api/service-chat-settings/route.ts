import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveServiceAccess } from "@/lib/licensing/service-access";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getServiceChatSettings, saveServiceChatSettings } from "@/lib/service-chat/store";
import { CHAT_ENABLED_SERVICES, type ChatEnabledService } from "@/lib/service-chat/types";

const service = z.enum(CHAT_ENABLED_SERVICES);
const settingsSchema = z.object({
  serviceSlug: service,
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string().trim().max(24).refine((value) => !value || /^\+?[0-9 ()-]+$/.test(value), "Enter a valid WhatsApp number."),
  telegramEnabled: z.boolean(),
  telegramUrl: z.string().trim().max(200).refine((value) => !value || /^https:\/\/(t\.me|telegram\.me)\/[a-zA-Z0-9_/?=&.-]+$/.test(value), "Use a valid https://t.me link."),
  liveChatEnabled: z.boolean(),
  liveChatEmbedCode: z.string().trim().max(12000),
});

async function canUseService(userId: string, role: string, serviceSlug: ChatEnabledService) {
  return (await resolveServiceAccess(userId, role, serviceSlug)).allowed;
}

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = service.safeParse(new URL(request.url).searchParams.get("serviceSlug"));
  if (!parsed.success) return NextResponse.json({ error: "Unsupported service." }, { status: 400 });
  if (!(await canUseService(caller.uid, caller.role, parsed.data))) return NextResponse.json({ error: "An active EazyTool subscription is required." }, { status: 403 });
  return NextResponse.json({ settings: await getServiceChatSettings(caller.uid, parsed.data as ChatEnabledService) });
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
  if (!(await canUseService(caller.uid, caller.role, parsed.data.serviceSlug))) return NextResponse.json({ error: "An active EazyTool subscription is required." }, { status: 403 });
  const settings = { ...parsed.data, userId: caller.uid, updatedAt: new Date().toISOString() };
  await saveServiceChatSettings(settings);
  return NextResponse.json({ settings });
}
