import Link from "next/link";
import { ArrowRight, Check, FileCheck2, Globe2, LockKeyhole, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Zap, title: "Fast by design", description: "Get from a blank page to a finished result in minutes, not hours." },
  { icon: FileCheck2, title: "Accurate output", description: "Clean, consistent results built for professional work and repeat use." },
  { icon: LockKeyhole, title: "Private workspace", description: "Your projects stay personal, focused, and in your control." },
  { icon: Globe2, title: "Ready anywhere", description: "Use your tools across devices whenever the next task calls for them." },
];

export function CTA() {
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
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="group rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10 sm:p-5">
                <div className="flex items-start justify-between gap-3 text-white"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon className="size-4" /></span><span className="text-[11px] font-semibold tracking-[0.16em] text-white/40">0{index + 1}</span></div>
                <h3 className="mt-5 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-white/70"><Check className="size-3.5 text-cyan-200" /> Included with every tool</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
