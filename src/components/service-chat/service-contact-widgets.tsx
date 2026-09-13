"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { ChatEnabledService, ServiceChatSettings } from "@/lib/service-chat/types";

export function ServiceContactWidgets({ serviceSlug }: { serviceSlug: ChatEnabledService }) {
  const [settings, setSettings] = useState<ServiceChatSettings | null>(null);
  useEffect(() => { getAuthHeaders().then((headers) => fetch(`/api/service-chat-settings?serviceSlug=${serviceSlug}`, { headers }).then((response) => response.ok ? response.json() : null)).then((data) => setSettings(data?.settings ?? null)); }, [serviceSlug]);
  useEffect(() => {
    function receivePreview(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== "eazytools-service-chat-preview" || event.data?.serviceSlug !== serviceSlug) return;
      const next = event.data.settings as ServiceChatSettings | undefined;
      if (next) setSettings(next);
    }
    window.addEventListener("message", receivePreview);
    return () => window.removeEventListener("message", receivePreview);
  }, [serviceSlug]);
  if (!settings) return null;
  const number = settings.whatsappNumber.replace(/\D/g, "");
  const whatsapp = settings.whatsappEnabled && number.length >= 7;
  const telegram = settings.telegramEnabled && /^https:\/\/(t\.me|telegram\.me)\//.test(settings.telegramUrl);
  const liveChat = settings.liveChatEnabled && Boolean(settings.liveChatEmbedCode.trim());
  return <>
    <div className="fixed bottom-5 right-5 z-[1001] flex flex-col gap-3">
      {telegram && <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat on Telegram" className="grid size-14 place-items-center rounded-full bg-[#229ed9] text-white shadow-xl transition-transform hover:-translate-y-0.5"><Send className="size-6" /></a>}
      {whatsapp && <a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-xl transition-transform hover:-translate-y-0.5"><MessageCircle className="size-7" /></a>}
    </div>
    {liveChat && <iframe title="Customer support live chat" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" srcDoc={`<!doctype html><html><head><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;width:100%;height:100%;background:transparent}</style></head><body>${settings.liveChatEmbedCode}</body></html>`} className="fixed bottom-0 right-0 z-[1000] h-[min(680px,100vh)] w-[min(430px,100vw)] border-0 bg-transparent" />}
  </>;
}
