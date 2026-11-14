"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Globe2, HelpCircle, MousePointerClick, Pause, Play, Search, Sparkles } from "lucide-react";

import { services, categories } from "@/lib/data/services";
import type { ServiceCategory } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ServiceCard } from "@/components/marketing/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const HERO_SLIDES = [
  { image: "/service-previews/website-builder-showcase.png", title: "Build something you are proud to share.", description: "Start with a clear brief, follow the guided steps, and preview your website before it goes live.", benefit: "Beginner-friendly from the first click", benefitIcon: MousePointerClick, alt: "EazyTool website builder showcase" },
  { image: "/service-previews/email-flashing-showcase.png", title: "Make every message look ready to send.", description: "Design clean emails and everyday digital messages without needing technical skills or complicated software.", benefit: "Professional results without the guesswork", benefitIcon: Sparkles, alt: "EazyTool email design showcase" },
  { image: "/service-previews/flight-itinerary-showcase.png", title: "Turn details into a polished result.", description: "Prepare clear travel documents and useful files with simple steps that keep important information organized.", benefit: "Preview your work before you finish", benefitIcon: Sparkles, alt: "EazyTool travel document showcase" },
  { image: "/services/logistics/logistics-website-showcase-branded.png", title: "Keep everyday business work moving.", description: "Track shipments, manage useful workflows, and bring repeat tasks into one familiar workspace.", benefit: "One place for the work you repeat", benefitIcon: Sparkles, alt: "EazyTool business platform showcase" },
];

export function ServicesClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = React.useState<ServiceCategory | "all">(
    (searchParams.get("category") as ServiceCategory) ?? "all",
  );
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % HERO_SLIDES.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = HERO_SLIDES[activeSlide];
  const BenefitIcon = slide.benefitIcon;
  const previousSlide = () => setActiveSlide((current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);

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
      <section className="relative isolate min-h-[34rem] overflow-hidden rounded-[2rem] border border-white/15 bg-[#071126] text-white shadow-[0_35px_110px_-55px_rgba(37,99,235,.9)]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {HERO_SLIDES.map((item, index) => <Image key={item.image} src={item.image} alt={item.alt} fill priority={index === 0} sizes="(min-width: 1024px) 85vw, 100vw" className={`object-cover object-center transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0"}`} />)}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050b1b]/[.98] via-[#071126]/[.84] to-[#071126]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050b1b]/80 via-transparent to-transparent" />
        <div className="relative flex min-h-[34rem] flex-col justify-between p-6 sm:p-10 lg:p-14">
          <div className="max-w-xl" aria-live="polite">
            <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-white [text-shadow:0_3px_14px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)] [-webkit-text-stroke:0.35px_rgba(255,255,255,0.3)] sm:text-5xl lg:text-6xl">{slide.title}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/80 sm:text-lg">{slide.description}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/85"><BenefitIcon className="size-4 text-cyan-200" />{slide.benefit}</div>
            <div className="mt-7"><Button className="bg-white text-slate-950 hover:bg-blue-50" asChild><Link href="#all-services">Explore every service <ArrowRight className="size-4" /></Link></Button></div>
          </div>
          <div className="flex items-end justify-between gap-4 pt-10">
            <div className="flex items-center gap-2" aria-label="Services hero slides">{HERO_SLIDES.map((item, index) => <button key={item.image} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}: ${item.title}`} aria-current={index === activeSlide} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-9 bg-cyan-200" : "w-2 bg-white/40 hover:bg-white/75"}`} />)}</div>
            <div className="flex items-center gap-1"><button type="button" onClick={previousSlide} aria-label="Previous service slide" className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/20 text-white/80 hover:bg-white/15 hover:text-white"><ArrowLeft className="size-4" /></button><button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play service slides" : "Pause service slides"} className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/20 text-white/80 hover:bg-white/15 hover:text-white">{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}</button><button type="button" onClick={nextSlide} aria-label="Next service slide" className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/20 text-white/80 hover:bg-white/15 hover:text-white"><ArrowRight className="size-4" /></button></div>
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
