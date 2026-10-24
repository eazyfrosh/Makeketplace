"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Globe2, HelpCircle, Search, Sparkles } from "lucide-react";

import { services, categories } from "@/lib/data/services";
import type { ServiceCategory } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ServiceCard } from "@/components/marketing/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ServicesClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = React.useState<ServiceCategory | "all">(
    (searchParams.get("category") as ServiceCategory) ?? "all",
  );

  const filtered = services.filter((service) => {
    const matchesCategory = activeCategory === "all" || service.category === activeCategory;
    const matchesQuery =
      !query.trim() ||
      service.name.toLowerCase().includes(query.toLowerCase()) ||
      service.tagline.toLowerCase().includes(query.toLowerCase()) ||
      service.features.some((f) => f.toLowerCase().includes(query.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border bg-[#071126] text-white shadow-[0_35px_110px_-55px_rgba(37,99,235,.9)]">
        <div className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-blue-500/30 blur-[90px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 size-64 rounded-full bg-violet-500/20 blur-[90px]" />
        <div className="relative grid gap-10 p-6 sm:p-9 lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:p-12">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-200">Choose what you want to create</span>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Powerful tools that feel easy
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/75 sm:text-lg">
              Build a website, create a travel document, track a shipment, design an email, and more—with clear steps anyone can follow.
            </p>
            <Button className="mt-7 bg-white text-slate-950 hover:bg-blue-50" asChild>
              <Link href="#all-services">Explore every service</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Examples of EazyTool services">
            <div className="relative col-span-2 aspect-[2/1] overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
              <Image src="/service-previews/website-builder-showcase.png" alt="EazyTool Website Builder design showcase" fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-4 text-sm font-semibold sm:text-base">Create your own website</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/15 shadow-xl">
              <Image src="/service-previews/flight-itinerary-showcase.png" alt="Sample Lagos-to-London flight itinerary showcase" fill sizes="(min-width: 1024px) 26vw, 50vw" className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-3 text-xs font-semibold sm:text-sm">Plan and preview trips</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/15 shadow-xl">
              <Image src="/services/logistics/logistics-website-showcase.png" alt="Unofficial logistics website design showcase" fill sizes="(min-width: 1024px) 26vw, 50vw" className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-3 text-xs font-semibold sm:text-sm">Track every shipment</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3 rounded-2xl border bg-primary/[0.06] p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div><h2 className="font-semibold">New here?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Start with one small task. You can preview your work before saving or publishing it.</p></div>
        </div>
        <div className="flex gap-3 rounded-2xl border bg-card p-4">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
          <div><h2 className="font-semibold">Not sure which tool to choose?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Use the Help button at the bottom of the screen for a simple list of common tasks.</p></div>
        </div>
      </div>

      <section className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:flex-row sm:items-center" aria-labelledby="domains-service-title">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Globe2 className="size-5" aria-hidden="true" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 id="domains-service-title" className="font-semibold">Domain Registration</h2><Badge variant="outline">Pay as you go</Badge><Badge>No subscription required</Badge></div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Search and buy a business domain from a free EazyTool account. You only pay for the domain you choose.</p>
          </div>
        </div>
        <Button className="shrink-0" asChild><Link href="/domains">Search domains</Link></Button>
      </section>

      <div id="all-services" className="mt-8 flex scroll-mt-24 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to do?"
            aria-label="Search services by task or name"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory("all")}>
            <Badge
              variant={activeCategory === "all" ? "default" : "outline"}
              className={cn("cursor-pointer px-3.5 py-1.5 text-sm", activeCategory !== "all" && "text-muted-foreground")}
            >
              All
            </Badge>
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}>
              <Badge
                variant={activeCategory === c.id ? "default" : "outline"}
                className={cn("cursor-pointer px-3.5 py-1.5 text-sm", activeCategory !== c.id && "text-muted-foreground")}
              >
                {c.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "service" : "services"} found
      </p>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service, i) => (
            <ServiceCard key={service.slug} service={service} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-12"
          title="No services match your search"
          description="Try a different keyword or clear the category filter."
        />
      )}
    </div>
  );
}
