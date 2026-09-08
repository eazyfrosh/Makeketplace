"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supportTemplates, createSupportSite, formatNaira } from "@/lib/support-sites/templates";
import { SupportSitePreview } from "./support-site-preview";

const FILTERS = ["All", "Fintech", "SaaS", "Ecommerce", "Logistics", "Technology", "Corporate", "Dark Mode"];
export function SupportTemplateMarketplace() {
  const [query, setQuery] = React.useState(""); const [filter, setFilter] = React.useState("All");
  const templates = supportTemplates.filter(t => t.enabled && (filter === "All" || t.category === filter) && `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="min-h-screen">
    <section className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-background to-cyan-400/10"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><Badge variant="soft"><Sparkles className="size-3" /> New service</Badge><h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Support websites that feel like your brand.</h1><p className="mt-5 max-w-2xl text-lg text-muted-foreground">Choose an original, professional help center. Customize every detail, publish it, and give customers a safer place to find answers.</p><div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300"><ShieldCheck className="size-4" /> For brands you own or are authorized to represent.</div></div></section>
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full max-w-md"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search templates..." className="h-11 pl-10" /></div><div className="flex flex-wrap gap-2">{FILTERS.map(item => <button key={item} onClick={()=>setFilter(item)}><Badge variant={filter===item?"default":"outline"} className="cursor-pointer px-3 py-1.5">{item}</Badge></button>)}</div></div>
      <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{templates.map(template => { const demo=createSupportSite(template.id,"preview"); return <article key={template.id} className="glass group overflow-hidden rounded-3xl"><div className="h-56 overflow-hidden border-b border-border/60 bg-muted"><div className="pointer-events-none h-[520px] w-[180%] origin-top-left scale-[.46]"><SupportSitePreview site={demo} compact /></div></div><div className="p-6"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline">{template.category}</Badge><h2 className="mt-3 text-xl font-semibold">{template.name}</h2></div><span className="font-semibold text-primary">{formatNaira(template.priceCents)}</span></div><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{template.description}</p><div className="mt-6 flex gap-2"><Button variant="secondary" className="flex-1" asChild><Link href={`/support-templates/${template.id}/preview`}><Eye className="size-4" /> Preview</Link></Button><Button className="flex-1" asChild><Link href={`/support-templates/${template.id}/editor`}>Customize <ArrowRight className="size-4" /></Link></Button></div></div></article>})}</div>
      {!templates.length && <div className="py-24 text-center text-muted-foreground">No templates match your search.</div>}
    </main></div>;
}
