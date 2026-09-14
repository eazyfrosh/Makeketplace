"use client";

import { useState } from "react";
import { ArrowUpRight, ExternalLink, Loader2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/licensing/client-auth";

const templates = [
  { id: "elite-broker", name: "ELITE BROKER", url: "https://premium-broker-platform.vercel.app", accent: "text-emerald-400", description: "A premium dark investment-dashboard design with customer-specific branding and a private template admin." },
  { id: "volterra", name: "Volterra", url: "https://tesla-blush-nine.vercel.app", accent: "text-rose-400", description: "A cinematic electric-vehicle and market-simulation experience with a private website editor." },
] as const;

export default function PremiumTemplatesPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function openExternalEditor(templateId: string) {
    setBusy(templateId); setError("");
    try {
      const headers = await getAuthHeaders();
      if (!Object.keys(headers).length) {
        window.location.assign("/auth/login?next=/platform/premium-templates");
        return;
      }
      const response = await fetch("/api/licenses/issue-access-token", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ serviceSlug: "premium-templates", templateId }) });
      const data = await response.json();
      if (!response.ok || !data.redirectUrl) throw new Error(data.error || "Unable to open the template.");
      window.location.assign(data.redirectUrl);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to open the template."); setBusy(null); }
  }
  return <main className="min-h-screen bg-slate-950 px-5 py-16 text-white sm:px-8"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">Premium templates</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">Choose your website.</h1><p className="mt-4 max-w-2xl text-slate-300">Choose ELITE BROKER or Volterra. Every template creates a private customer-specific website admin, and your changes never alter the original platform admin.</p><div className="mt-6 flex flex-wrap gap-2">{templates.map((template) => <a key={template.id} href={`#${template.id}`} className="rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-sm font-semibold hover:bg-white/10">{template.name}</a>)}</div>{error && <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}<div className="mt-10 grid gap-7 lg:grid-cols-2">{templates.map((template) => <article id={template.id} key={template.id} className="scroll-mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[.04] shadow-2xl"><div className="h-72 overflow-hidden border-b border-white/10 bg-white"><iframe className="pointer-events-none h-[620px] w-[170%] origin-top-left scale-[.48]" src={template.url} title={`${template.name} preview`} /></div><div className="p-7"><p className={`text-xs font-bold uppercase tracking-[.2em] ${template.accent}`}>Premium template</p><h2 className="mt-3 text-2xl font-bold">{template.name}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">{template.description}</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => openExternalEditor(template.id)} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200 disabled:opacity-60">{busy === template.id ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpRight className="size-4" />}{busy === template.id ? "Opening…" : "Open website admin"}</button><a href={template.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">Preview <ExternalLink className="size-4" /></a></div></div></article>)}</div></div></main>;
}
