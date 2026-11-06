"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, LockKeyhole, Monitor, Search, ShieldCheck, Smartphone, Sparkles, Tablet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supportTemplates as builtInTemplates, createSupportSite as buildSupportSite } from "@/lib/support-sites/templates";
import { getPublishedTemplateSite, getSupportTemplates } from "@/lib/support-sites/store";
import type { SupportSite, SupportTemplate } from "@/lib/support-sites/types";
import { SupportSitePreview } from "./support-site-preview";
import { getAuthHeaders } from "@/lib/licensing/client-auth";

const FILTERS = ["All", "Fintech", "SaaS", "Ecommerce", "Logistics", "Technology", "Corporate", "Dark Mode"];
type PreviewMode = "desktop" | "tablet" | "mobile";

const previewLogoPaths: Record<string, string> = {
  "aura-fintech": "/support-templates/logos/apple.svg",
  "orbit-crypto-saas": "/support-templates/logos/binance.svg",
  cartwise: "/support-templates/logos/bitcoin.svg",
  routecare: "/support-templates/logos/byd.svg",
  "wells-fargo-help": "/support-templates/logos/wells-fargo.svg",
  "clarity-docs": "/support-templates/logos/bitso.svg",
  "summit-corporate": "/support-templates/logos/changelly.svg",
  plainhelp: "/support-templates/logos/cashapp.svg",
  nightshift: "/support-templates/logos/blockchain.svg",
};

type PreviewModalProps = {
  site: SupportSite;
  template: SupportTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function PreviewModal({ site, template, open, onOpenChange }: PreviewModalProps) {
  const [mode, setMode] = React.useState<PreviewMode>("desktop");
  const viewportWidth = mode === "mobile" ? "w-[390px] max-w-full" : mode === "tablet" ? "w-[820px] max-w-full" : "w-full";

  React.useEffect(() => {
    if (open) setMode("desktop");
  }, [open, site.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(94vh,960px)] max-w-[min(96vw,1440px)] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-background/95 px-4 py-3 pr-12 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <DialogTitle className="truncate text-base sm:text-lg">{template.name}</DialogTitle>
              <DialogDescription className="mt-1 truncate">Full website preview — {mode} view</DialogDescription>
            </div>
            <div className="flex shrink-0 gap-1 rounded-xl border bg-muted/50 p-1" aria-label="Preview device size">
              {(["desktop", "tablet", "mobile"] as const).map((value) => {
                const Icon = value === "desktop" ? Monitor : value === "tablet" ? Tablet : Smartphone;
                return <button key={value} type="button" onClick={() => setMode(value)} aria-label={`${value} preview`} aria-pressed={mode === value} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold capitalize transition-colors sm:px-3 ${mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-3.5" />{value}</button>;
              })}
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto bg-muted/60 p-2 sm:p-4">
          <div className={`mx-auto min-h-full overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-black/10 transition-[width] duration-200 ${viewportWidth}`}>
            <SupportSitePreview site={site} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SupportTemplateMarketplace() {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("All");
  const [catalog, setCatalog] = React.useState<SupportTemplate[]>(builtInTemplates);
  const [showcases, setShowcases] = React.useState<Record<string, SupportSite>>({});
  const [canCustomize, setCanCustomize] = React.useState(false);
  const [preview, setPreview] = React.useState<{ template: SupportTemplate; site: SupportSite } | null>(null);

  React.useEffect(() => {
    getSupportTemplates().then(async (items) => {
      setCatalog(items);
      const rows = await Promise.all(items.map(async (item) => [item.id, await getPublishedTemplateSite(item.id)] as const));
      setShowcases(Object.fromEntries(rows.filter((row): row is readonly [string, SupportSite] => Boolean(row[1]))));
    });
  }, []);

  React.useEffect(() => {
    getAuthHeaders()
      .then((headers) => fetch("/api/subscriptions/access?serviceSlug=support-website-templates", { headers }))
      .then((response) => response.ok ? response.json() : { allowed: false })
      .then((data) => setCanCustomize(Boolean(data.allowed)))
      .catch(() => setCanCustomize(false));
  }, []);

  const createSupportSite = (templateId: string, userId: string) => buildSupportSite(templateId, userId, catalog);
  const templates = catalog.filter((template) => template.enabled && (filter === "All" || template.category === filter) && `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="min-h-screen">
    <section className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-background to-cyan-400/10"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><Badge variant="soft"><Sparkles className="size-3" /> New service</Badge><h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Support websites that feel like your brand.</h1><p className="mt-5 max-w-2xl text-lg text-muted-foreground">Choose an original, professional help center. Customize every detail, publish it, and give customers a safer place to find answers.</p><div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300"><ShieldCheck className="size-4" /> For brands you own or are authorized to represent.</div></div></section>
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full max-w-md"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates..." className="h-11 pl-10" /></div><div className="flex flex-wrap gap-2">{FILTERS.map((item) => <button key={item} onClick={() => setFilter(item)}><Badge variant={filter === item ? "default" : "outline"} className="cursor-pointer px-3 py-1.5">{item}</Badge></button>)}</div></div>
      <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{templates.map((template) => { const demo = showcases[template.id] ?? createSupportSite(template.id, "preview"); const logo = previewLogoPaths[template.id]; return <article key={template.id} className="glass group overflow-hidden rounded-3xl"><div className="relative h-56 overflow-hidden border-b border-border/60 bg-muted"><div className="pointer-events-none h-[520px] w-[180%] origin-top-left scale-[.46]"><SupportSitePreview site={demo} compact /></div>{logo && <div className="pointer-events-none absolute left-3 top-3 flex h-10 min-w-10 items-center justify-center rounded-lg border border-black/10 bg-white px-2 shadow-lg"><img src={logo} alt={`${template.name} logo`} className="max-h-7 w-auto max-w-28 object-contain" /></div>}</div><div className="p-6"><div><Badge variant="outline">{template.category}</Badge><h2 className="mt-3 text-xl font-semibold">{template.name}</h2></div><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{template.description}</p><p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">{!canCustomize && <LockKeyhole className="size-3.5" />}Included with EazyTool All Access</p><div className="mt-6 flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setPreview({ template, site: demo })}><Eye className="size-4" /> Preview</Button>{canCustomize ? <Button className="flex-1" asChild><Link href={`/support-templates/${template.id}/editor`}>Customize <ArrowRight className="size-4" /></Link></Button> : <Button className="flex-1" variant="outline" asChild><Link href="/pricing"><LockKeyhole className="size-4" /> Subscribe to customize</Link></Button>}</div></div></article>; })}</div>
      {!templates.length && <div className="py-24 text-center text-muted-foreground">No templates match your search.</div>}
    </main>
    {preview && <PreviewModal site={preview.site} template={preview.template} open onOpenChange={(open) => { if (!open) setPreview(null); }} />}
  </div>;
}
