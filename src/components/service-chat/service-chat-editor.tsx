"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { defaultServiceChatSettings, type ChatEnabledService, type ServiceChatSettings } from "@/lib/service-chat/types";

export function ServiceChatEditor({ serviceSlug, serviceName }: { serviceSlug: ChatEnabledService; serviceName: string }) {
  const [settings, setSettings] = useState<ServiceChatSettings>(() => defaultServiceChatSettings("", serviceSlug));
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { getAuthHeaders().then((headers) => fetch(`/api/service-chat-settings?serviceSlug=${serviceSlug}`, { headers }).then((response) => response.json())).then((data) => data.settings && setSettings(data.settings)).finally(() => setLoading(false)); }, [serviceSlug]);
  const set = <K extends keyof ServiceChatSettings>(key: K, value: ServiceChatSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  async function save() { setSaving(true); try { const headers = await getAuthHeaders(); const response = await fetch("/api/service-chat-settings", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(settings) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSettings(data.settings); toast.success("Chat settings saved and published"); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save settings."); } finally { setSaving(false); } }
  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-6 animate-spin" /></div>;
  const number = settings.whatsappNumber.replace(/\D/g, "");
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">{serviceName}</p><h1 className="mt-1 text-3xl font-semibold">Contact chat widgets</h1><p className="mt-2 text-muted-foreground">Add optional customer contact buttons without changing the platform admin.</p></div><Button variant="secondary" asChild><Link href={`/platform/${serviceSlug}`}>Back to website</Link></Button></div>
    <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]"><section className="space-y-5 rounded-3xl border bg-card p-6">
      <WidgetGroup title="WhatsApp Chat Widget" checked={settings.whatsappEnabled} onChecked={(value) => set("whatsappEnabled", value)} label="Enable WhatsApp floating button"><Input value={settings.whatsappNumber} onChange={(event) => set("whatsappNumber", event.target.value)} placeholder="+2348012345678" /><p className="text-xs text-muted-foreground">Include the international country code.</p></WidgetGroup>
      <WidgetGroup title="Telegram" checked={settings.telegramEnabled} onChecked={(value) => set("telegramEnabled", value)} label="Enable Telegram floating button"><Input type="url" value={settings.telegramUrl} onChange={(event) => set("telegramUrl", event.target.value)} placeholder="https://t.me/yourbusiness" /></WidgetGroup>
      <WidgetGroup title="Custom Live Chat Embed Code" checked={settings.liveChatEnabled} onChecked={(value) => set("liveChatEnabled", value)} label="Enable custom live chat widget"><textarea className="min-h-40 w-full rounded-xl border bg-background p-3 font-mono text-xs" value={settings.liveChatEmbedCode} onChange={(event) => set("liveChatEmbedCode", event.target.value)} placeholder="Paste your Tawk.to, Crisp, Tidio, or other provider code" maxLength={12000} /><p className="text-xs text-muted-foreground">The third-party code runs in an isolated frame alongside WhatsApp and Telegram.</p></WidgetGroup>
      <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}{saving ? "Saving…" : "Save and publish"}</Button>
    </section><aside className="relative min-h-[520px] overflow-hidden rounded-3xl bg-slate-950 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-white/50">Live preview</p><h2 className="mt-3 text-2xl font-semibold">{serviceName}</h2><p className="mt-2 text-sm text-white/60">Your contact buttons will float above the customer-facing website.</p><div className="absolute bottom-5 right-5 flex flex-col gap-3">{settings.telegramEnabled && settings.telegramUrl && <span className="grid size-14 place-items-center rounded-full bg-[#229ed9]"><Send className="size-6" /></span>}{settings.whatsappEnabled && number.length >= 7 && <span className="grid size-14 place-items-center rounded-full bg-[#25d366]"><MessageCircle className="size-7" /></span>}</div>{settings.liveChatEnabled && settings.liveChatEmbedCode.trim() && <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs">Live chat widget enabled</div>}</aside></div>
  </main>;
}

function WidgetGroup({ title, checked, onChecked, label, children }: { title: string; checked: boolean; onChecked: (value: boolean) => void; label: string; children: React.ReactNode }) { return <fieldset className="space-y-4 rounded-2xl border p-5"><legend className="px-2 font-semibold">{title} <span className="font-normal text-muted-foreground">(optional)</span></legend><label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={checked} onChange={(event) => onChecked(event.target.checked)} />{label}</label>{children}</fieldset>; }
