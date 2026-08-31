"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Box, Check, Clock3, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

const TRUST_POINTS = ["Source code included", "Launch support", "Secure checkout"];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06] pb-14 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-20">
        <Image src="/hero/hero.png" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-30 dark:opacity-45" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,transparent)_52%,color-mix(in_oklab,var(--background)_72%,transparent)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-background to-transparent" />
      <div className="hero-orb pointer-events-none absolute -right-32 top-8 -z-10 size-[34rem] rounded-full bg-violet-500/15 blur-[100px]" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-8">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-lg shadow-black/5">
            <Sparkles className="size-3.5 text-primary" />
            <span>Curated digital products for ambitious teams</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="mt-7 text-balance text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
            Great products,
            <span className="mt-2 block text-gradient-brand">ready when you are.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Skip the blank canvas. Shop production-ready platforms, expert design, AI automation, and custom engineering—all built by a senior product team.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/services">Browse the marketplace<ArrowUpRight className="size-4" /></Link></Button>
            <Button size="lg" variant="secondary" asChild><Link href="/contact">Build something custom</Link></Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST_POINTS.map((point) => <span key={point} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5 text-emerald-400" />{point}</span>)}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.12 }} className="relative mx-auto w-full max-w-[660px] lg:mx-0">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-brand opacity-10 blur-3xl" />
          <div className="glass relative overflow-hidden rounded-[1.75rem] p-2 shadow-[0_30px_100px_-30px_rgba(45,25,90,0.6)] sm:p-3">
            <div className="relative aspect-[1.18/1] overflow-hidden rounded-[1.35rem] bg-[#090a12] sm:aspect-[1.32/1]">
              <Image src="/services/banking/overview.png" alt="Nexova digital banking platform dashboard" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover object-left-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 p-4 text-white backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5">
                <div><div className="flex items-center gap-2 text-xs text-white/60"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />Featured platform</div><p className="mt-1.5 font-semibold sm:text-lg">Digital Banking Suite</p></div>
                <div className="text-right"><p className="text-[10px] uppercase tracking-[0.18em] text-white/50">From</p><p className="font-semibold">$8,999</p></div>
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
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3 lg:grid-cols-4">
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
