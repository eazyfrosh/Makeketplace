"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Box, Check, ChevronLeft, ChevronRight, Clock3, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

const TRUST_POINTS = ["Source code included", "Launch support", "Secure checkout"];

const SHOWCASE_SLIDES = [
  {
    src: "/hero/showcase-design.png",
    alt: "A coordinated collection of premium web, mobile, and product design interfaces",
    eyebrow: "Design that feels distinctive",
    title: "Beautiful digital experiences",
    accent: "bg-fuchsia-400 shadow-[0_0_12px_#e879f9]",
  },
  {
    src: "/hero/showcase-automation.png",
    alt: "Connected AI workflows automating documents, data, and business applications",
    eyebrow: "Automation that saves time",
    title: "Smarter systems, connected",
    accent: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
  },
  {
    src: "/hero/showcase-launch.png",
    alt: "A polished digital product launching across web and mobile experiences",
    eyebrow: "From first idea to launch",
    title: "Built for real momentum",
    accent: "bg-orange-300 shadow-[0_0_12px_#fdba74]",
  },
];

export function Hero() {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const reduceMotion = useReducedMotion();

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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-lg shadow-black/5">
            <Sparkles className="size-3.5 text-primary" />
            <span>Nexova / Curated digital work</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="mt-7 text-balance text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
            Software that starts ahead.
            <span className="home-display mt-3 block text-gradient-brand">Made for the next move.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Skip the blank canvas. Start with production-ready platforms, sharp design, and practical business tools—then bring in a senior team when the brief gets interesting.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/services">Browse the marketplace<ArrowUpRight className="size-4" /></Link></Button>
            <Button size="lg" variant="secondary" asChild><Link href="/contact">Build something custom</Link></Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST_POINTS.map((point) => <span key={point} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5 text-emerald-400" />{point}</span>)}
          </motion.div>
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
          aria-label="Nexova product capabilities"
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
            <div><div className="flex items-center gap-1 text-xs font-semibold">4.9 <Star className="size-3 fill-amber-400 text-amber-400" /></div><p className="text-[10px] text-muted-foreground">Trusted by 1,500+ teams</p></div>
          </motion.div>
        </motion.div>
      </div>

      <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-foreground/[0.06] sm:grid-cols-3 lg:grid-cols-4">
          {[
            { icon: Box, value: "8", label: "Specialist product lines" },
            { icon: Clock3, value: "48h", label: "Average project kickoff" },
            { icon: Star, value: "4.9/5", label: "Average client rating" },
            { icon: BadgeCheck, value: "100%", label: "Source code ownership" },
          ].map(({ icon: Icon, value, label }, index) => <div key={label} className={`flex items-center gap-3 bg-background/65 px-5 py-4 backdrop-blur-xl ${index === 3 ? "sm:col-span-3 lg:col-span-1" : ""}`}><Icon className="size-4 text-primary" /><div className="flex items-baseline gap-2"><strong className="text-sm">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div></div>)}
        </div>
      </div>
    </section>
  );
}
