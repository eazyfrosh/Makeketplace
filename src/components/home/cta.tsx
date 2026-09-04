import Link from "next/link";
import { ArrowRight, Check, FileCheck2, Globe2, LockKeyhole, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast by design",
    description: "Get from a blank page to a finished result in minutes, not hours.",
  },
  {
    icon: FileCheck2,
    title: "Accurate output",
    description: "Clean, consistent results built for professional work and repeat use.",
  },
  {
    icon: LockKeyhole,
    title: "Private workspace",
    description: "Your projects stay personal, focused, and in your control.",
  },
  {
    icon: Globe2,
    title: "Ready anywhere",
    description: "Use your tools across devices whenever the next task calls for them.",
  },
];

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-brand px-7 py-12 shadow-[0_35px_100px_-45px_rgba(99,102,241,0.9)] sm:px-12 sm:py-16 lg:px-16 lg:py-20">
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              <Sparkles className="size-4" /> Everything in one place
            </span>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Everything You Need
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
              Powerful tools built for speed, accuracy, and total privacy.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              Create, customize, and move forward with a growing collection of dependable digital tools for your everyday hustle.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90" asChild>
                <Link href="/services">Explore the marketplace <ArrowRight className="size-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" asChild>
                <Link href="/contact">Talk to our team</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-black/15 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-white">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/15"><Icon className="size-4" /></span>
                  <h3 className="text-sm font-semibold">{title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-white/70"><Check className="size-3.5 text-cyan-200" /> Included with every tool</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
