"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, ChevronLeft, ChevronRight, Globe2, Grid2X2, LayoutTemplate, Mail, Star, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

const TRUST_POINTS = ["Clear step-by-step guidance", "Works on phone and computer", "Help when you need it"];
const HERO_HEADLINE = "Build a website and\ncreate digital demos from one workspace.";
const HERO_HEADLINE_BREAK = HERO_HEADLINE.indexOf("\n");

const SHOWCASE_SLIDES = [
  {
    src: "/service-previews/banking-platform-v3.png",
    alt: "A digital banking dashboard shown across laptop and mobile screens",
    eyebrow: "Manage business tools",
    title: "Clear dashboards, ready to use",
    accent: "bg-fuchsia-400 shadow-[0_0_12px_#e879f9]",
  },
  {
    src: "/service-previews/website-builder-v2.png",
    alt: "A collection of polished website designs for businesses, banking, trading, property, and personal brands",
    eyebrow: "Build your own website",
    title: "Choose a design and make it yours",
    accent: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
  },
  {
    src: "/service-previews/support-websites-v3.png",
    alt: "A modern help centre shown across desktop, laptop, and mobile screens",
    eyebrow: "Help made simple",
    title: "Friendly tools for real people",
    accent: "bg-orange-300 shadow-[0_0_12px_#fdba74]",
  },
];

const QUICK_STARTS = [
  { href: "/services/premium-templates", icon: LayoutTemplate, title: "Create a website", description: "Choose a design and make it yours" },
  { href: "/platform/email-designer", icon: Mail, title: "Design an email", description: "Write, preview, and send your message" },
  { href: "/domains", icon: Globe2, title: "Buy a domain", description: "Find an address for your business" },
  { href: "/services", icon: Grid2X2, title: "See every tool", description: "Browse everything EazyTool can do" },
];

export function Hero() {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [typedHeadline, setTypedHeadline] = React.useState("");
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion) {
      setTypedHeadline(HERO_HEADLINE);
      return;
    }
    if (typedHeadline.length >= HERO_HEADLINE.length) return;
    const timeout = window.setTimeout(
      () => setTypedHeadline(HERO_HEADLINE.slice(0, typedHeadline.length + 1)),
      32,
    );
    return () => window.clearTimeout(timeout);
  }, [reduceMotion, typedHeadline]);

  React.useEffect(() => {
    if (paused || reduceMotion) return;
    const interval = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % SHOWCASE_SLIDES.length),
      5200,
    );
    return () => window.clearInterval(interval);
  }, [paused, reduceMotion]);

  const previousSlide = () =>
    setActiveSlide((current) => (current - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length);
  const nextSlide = () =>
    setActiveSlide((current) => (current + 1) % SHOWCASE_SLIDES.length);

  return (
    <section className="hero-surface relative isolate overflow-hidden border-b border-border/70 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-20">
        <Image src="/hero/hero.png" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-0 dark:opacity-45" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,transparent)_52%,color-mix(in_oklab,var(--background)_72%,transparent)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-background to-transparent" />
      <div className="hero-orb pointer-events-none absolute -right-32 top-8 -z-10 size-[34rem] rounded-full bg-violet-400/20 blur-[100px] dark:bg-violet-500/15" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-8">
        <div className="max-w-2xl">
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="mt-7 text-balance text-[clamp(2.8rem,5.5vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
            <span className="sr-only">Build a website and create digital demos from one workspace.</span>
            <span aria-hidden="true">
              {typedHeadline.slice(0, HERO_HEADLINE_BREAK)}
              <span className="home-display mt-3 block text-gradient-brand">{typedHeadline.slice(HERO_HEADLINE_BREAK + 1)}</span>
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Customize website templates, design emails, create sample itineraries and receipts, and manage shipment tracking pages—without starting from scratch.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/services">See all tools<ArrowUpRight className="size-4" /></Link></Button>
            <Button size="lg" variant="secondary" asChild><Link href="/auth/signup">Create an account</Link></Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST_POINTS.map((point) => <span key={point} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5 text-emerald-400" />{point}</span>)}
          </motion.div>

          <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200/90">
            <TriangleAlert className="size-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
            <span>EazyTool is for demo and educational purposes.</span>
            <Link href="/legal/terms" className="shrink-0 font-semibold text-amber-950 underline decoration-amber-950/40 underline-offset-2 hover:text-black dark:text-amber-100 dark:decoration-amber-100/40 dark:hover:text-white">Read more</Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative mx-auto w-full max-w-[660px] lg:mx-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          aria-roledescription="carousel"
          aria-label="EazyTool product capabilities"
        >
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-brand opacity-10 blur-3xl" />
          <div className="glass relative overflow-hidden rounded-[1.75rem] p-2 shadow-[0_30px_100px_-30px_rgba(45,25,90,0.6)] sm:p-3">
            <div className="relative aspect-[1.18/1] overflow-hidden rounded-[1.35rem] bg-[#090a12] sm:aspect-[1.32/1]">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={SHOWCASE_SLIDES[activeSlide].src}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                  transition={{ duration: reduceMotion ? 0.15 : 0.65, ease: "easeOut" }}
                  className="absolute inset-0"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${activeSlide + 1} of ${SHOWCASE_SLIDES.length}`}
                >
                  <Image
                    src={SHOWCASE_SLIDES[activeSlide].src}
                    alt={SHOWCASE_SLIDES[activeSlide].alt}
                    fill
                    priority={activeSlide === 0}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover object-center"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 p-4 text-white backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5">
                <div aria-live="polite">
                  <div className="flex items-center gap-2 text-xs text-white/60"><span className={`size-2 rounded-full ${SHOWCASE_SLIDES[activeSlide].accent}`} />{SHOWCASE_SLIDES[activeSlide].eyebrow}</div>
                  <p className="mt-1.5 font-semibold sm:text-lg">{SHOWCASE_SLIDES[activeSlide].title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={previousSlide} className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Previous showcase"><ChevronLeft className="size-4" /></button>
                  <button type="button" onClick={nextSlide} className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Next showcase"><ChevronRight className="size-4" /></button>
                </div>
              </div>
              <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-2 backdrop-blur-md">
                {SHOWCASE_SLIDES.map((slide, index) => (
                  <button key={slide.src} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}: ${slide.title}`} aria-current={index === activeSlide ? "true" : undefined} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-6 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"}`} />
                ))}
              </div>
            </div>
          </div>

          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="glass absolute -left-3 top-10 hidden items-center gap-3 rounded-2xl p-3.5 shadow-xl sm:flex lg:-left-12">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400/15"><BadgeCheck className="size-5 text-emerald-400" /></span>
            <div><p className="text-xs font-semibold">Launch-ready</p><p className="mt-0.5 text-[11px] text-muted-foreground">Production-grade code</p></div>
          </motion.div>

          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="glass absolute -bottom-5 right-3 flex items-center gap-3 rounded-2xl p-3.5 shadow-xl sm:right-8 lg:-right-6">
            <div className="flex -space-x-2">{["MC", "DO", "PN"].map((initials, index) => <span key={initials} className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-gradient-brand text-[9px] font-bold text-white" style={{ zIndex: 3 - index }}>{initials}</span>)}</div>
            <div><div className="flex items-center gap-1 text-xs font-semibold">Easy to follow <Star className="size-3 fill-amber-400 text-amber-400" /></div><p className="text-[10px] text-muted-foreground">Designed for every experience level</p></div>
          </motion.div>
        </motion.div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl px-4 sm:mt-20 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-primary">Start with one simple task</p><h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">What would you like to do today?</h2></div>
          <p className="text-sm text-muted-foreground">Choose an option. We will guide you from there.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_STARTS.map(({ href, icon: Icon, title, description }) => <Link key={href} href={href} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 font-semibold">{title}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span><span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span></span></Link>)}
        </div>
      </div>
    </section>
  );
}
