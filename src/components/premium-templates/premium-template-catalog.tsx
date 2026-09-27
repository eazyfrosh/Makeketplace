"use client";
import { useState } from "react";
import { ExternalLink, Eye, Loader2, Pencil, Settings } from "lucide-react";
import { getAuthHeaders } from "@/lib/licensing/client-auth";

const templates = [
  { id: "elite-broker", name: "ELITE BROKER", url: "https://premium-broker-platform.vercel.app", accent: "text-emerald-400", description: "A premium dark investment-dashboard design with customer-specific branding and private owner controls." },
  { id: "volterra", name: "Volterra", url: "https://tesla-blush-nine.vercel.app", accent: "text-rose-400", description: "A cinematic electric-vehicle and market-simulation experience with customer-specific branding and private owner controls." },
] as const;
type Destination = "admin" | "editor" | "preview";

export function PremiumTemplateCatalog() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function openProtected(templateId: string, destination: Destination) {
    const key = `${templateId}-${destination}`; setBusy(key); setError("");
    try {
      const headers = await getAuthHeaders();
      if (!Object.keys(headers).length) { window.location.assign("/auth/login?next=/services/premium-templates#templates"); return; }
      const response = await fetch("/api/licenses/issue-access-token", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ serviceSlug: "premium-templates", templateId, destination }) });
      const data = await response.json();
      if (!response.ok || !data.redirectUrl) throw new Error(data.error || "Unable to open the template.");
      window.location.assign(data.redirectUrl);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to open the template."); setBusy(null); }
  }
  return <section id="templates" className="scroll-mt-20 border-y border-white/10 bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">Premium template library</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Choose your website template</h2><p className="mt-4 max-w-3xl text-slate-300">Every subscriber gets a private editor and a unique public website link. Connect a domain purchased in EazyTool when you are ready to publish.</p>
    {error && <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
    <div className="mt-10 grid gap-7 lg:grid-cols-2">{templates.map((template) => <article key={template.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.04] shadow-2xl">
      <a href={template.url} target="_blank" rel="noopener noreferrer" className="block h-72 overflow-hidden border-b border-white/10 bg-white" aria-label={`View ${template.name} demo`}><iframe className="pointer-events-none h-[620px] w-[170%] origin-top-left scale-[.48]" src={template.url} title={`${template.name} preview`} loading="lazy" /></a>
      <div className="p-7"><p className={`text-xs font-bold uppercase tracking-[.2em] ${template.accent}`}>Premium template</p><h3 className="mt-3 text-2xl font-bold">{template.name}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">{template.description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button onClick={() => openProtected(template.id, "preview")} disabled={Boolean(busy)} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-60">{busy === `${template.id}-preview` ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}My Website</button>
          <button onClick={() => openProtected(template.id, "editor")} disabled={Boolean(busy)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200 disabled:opacity-60">{busy === `${template.id}-editor` ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}Editor</button>
          <button onClick={() => openProtected(template.id, "admin")} disabled={Boolean(busy)} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-60">{busy === `${template.id}-admin` ? <Loader2 className="size-4 animate-spin" /> : <Settings className="size-4" />}Generate / Open Admin</button>
        </div><a href={template.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">Open demo website <ExternalLink className="size-3" /></a>
      </div></article>)}</div>
  </div></section>;
}
