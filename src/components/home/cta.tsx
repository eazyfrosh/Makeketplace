"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileCheck2, Globe2, LockKeyhole, Pause, Play, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const SLIDES = [
  { image: "/service-previews/website-design-v3.png", label: "Website building", title: "Turn your idea into a polished website." },
  { image: "/service-previews/email-designer-v3.png", label: "Email design", title: "Create clear, professional emails in less time." },
  { image: "/service-previews/premium-templates.png", label: "Ready-made tools", title: "Start faster with a template built for the job." },
  { image: "/hero/showcase-automation.png", label: "Everyday digital work", title: "Keep important tasks simple and organized." },
];

const FEATURES = [
  { icon: Zap, title: "Fast by design", description: "Get from a blank page to a finished result in minutes, not hours." },
  { icon: FileCheck2, title: "Accurate output", description: "Clean, consistent results built for professional work and repeat use." },
  { icon: LockKeyhole, title: "Private workspace", description: "Your projects stay personal, focused, and in your control." },
  { icon: Globe2, title: "Ready anywhere", description: "Use your tools across devices whenever the next task calls for them." },
];

export function CTA() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % SLIDES.length), 4500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[activeSlide];
  const showPrevious = () => setActiveSlide((current) => (current - 1 + SLIDES.length) % SLIDES.length);
  const showNext = () => setActiveSlide((current) => (current + 1) % SLIDES.length);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="home-cta-surface relative overflow-hidden rounded-[2rem] border border-white/15 px-5 py-8 shadow-[0_35px_100px_-45px_rgba(9,20,38,0.9)] sm:px-10 sm:py-12 lg:px-16 lg:py-16">
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-cyan-300/15 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80"><Sparkles className="size-4" /> Everything in one place</span>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-[1.08] tracking-[-0.05em] text-white sm:text-5xl">Start with one simple task</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">Choose a tool, follow the clear instructions, and check your work before you finish.</p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">EazyTool brings websites, email design, domains, business platforms, and everyday digital tools into one familiar workspace.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" className="w-full bg-white text-black shadow-lg shadow-black/10 hover:bg-white/90 sm:w-auto" asChild><Link href="/services">Explore the marketplace <ArrowRight className="size-4" /></Link></Button>
              <Button size="lg" variant="outline" className="w-full border-white/40 text-white hover:bg-white/10 sm:w-auto" asChild><Link href="/contact">Talk to our team</Link></Button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/50 shadow-2xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              <div className="relative aspect-[16/10] w-full">
                {SLIDES.map((item, index) => <Image key={item.image} src={item.image} alt={item.title} fill priority={index === 0} sizes="(max-width: 1024px) 100vw, 55vw" className={`object-cover object-top transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0"}`} />)}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{slide.label}</p><h3 className="mt-2 max-w-md text-xl font-semibold leading-tight text-white sm:text-2xl">{slide.title}</h3></div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-1.5" aria-label="Slideshow navigation">{SLIDES.map((item, index) => <button key={item.image} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show ${item.label}`} aria-current={index === activeSlide} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-7 bg-cyan-200" : "w-1.5 bg-white/35 hover:bg-white/70"}`} />)}</div>
                <div className="flex items-center gap-1"><button type="button" onClick={showPrevious} aria-label="Previous slide" className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"><ArrowLeft className="size-4" /></button><button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play slideshow" : "Pause slideshow"} className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}</button><button type="button" onClick={showNext} aria-label="Next slide" className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"><ArrowRight className="size-4" /></button></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => <div key={title} className="rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10 sm:p-5"><div className="flex items-center gap-3 text-white"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon className="size-4" /></span><h3 className="text-sm font-semibold">{title}</h3></div><p className="mt-3 text-sm leading-6 text-white/65">{description}</p><div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-white/70"><Check className="size-3.5 text-cyan-200" /> Included with every tool</div></div>)}
        </div>
      </div>
    </section>
  );
}
