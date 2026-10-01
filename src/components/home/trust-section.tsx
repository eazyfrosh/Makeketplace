"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CheckCircle2, Headset, LockKeyhole, Radio, Zap } from "lucide-react";

const TRUST_POINTS = [
  { icon: LockKeyhole, title: "Your own private account" },
  { icon: Zap, title: "Clear steps and quick actions" },
  { icon: Headset, title: "Help when you get stuck" },
  { icon: Radio, title: "Works across your devices" },
  { icon: BadgeCheck, title: "Preview before you finish" },
  { icon: CheckCircle2, title: "Helpful status messages" },
];

export function TrustSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-white/[0.018] py-24 lg:py-32">
      <div className="pointer-events-none absolute -left-24 top-1/2 size-72 -translate-y-1/2 rounded-full bg-cyan-400/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-0 size-80 rounded-full bg-violet-400/[0.08] blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Confidence at every step</span>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              You should always know what to do next.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              EazyTool uses short explanations, visible progress, and clear actions to help beginners work comfortably and confidently.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TRUST_POINTS.map(({ icon: Icon, title }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (index % 2) * 0.08 }}
                className="glass flex items-center gap-4 rounded-2xl px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-soft ring-1 ring-white/10">
                  <Icon className="size-4 text-primary" />
                </span>
                <span className="text-sm font-medium">{title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
