"use client";

import { motion } from "framer-motion";
import { Clock, Code2, LifeBuoy, ShieldCheck, Sparkles, Wallet } from "lucide-react";

const REASONS = [
  {
    icon: Code2,
    title: "Plain, simple language",
    description: "Buttons and instructions explain what will happen, so you never have to guess what a technical word means.",
  },
  {
    icon: Clock,
    title: "Quick ways to start",
    description: "Ready-made templates and clear choices help you begin without setting up everything from an empty page.",
  },
  {
    icon: ShieldCheck,
    title: "Clear account protection",
    description: "Sign-in checks and private account areas help keep your projects and personal information separated from other users.",
  },
  {
    icon: Wallet,
    title: "Know before you pay",
    description: "See the price and purpose before checkout. Your wallet is only used for eligible EazyTool services.",
  },
  {
    icon: LifeBuoy,
    title: "Help is always nearby",
    description: "Use the Help button from any page or contact support when you are unsure about the next step.",
  },
  {
    icon: Sparkles,
    title: "Friendly on every device",
    description: "Layouts adapt to phones, tablets, and computers with comfortable text and touch-friendly buttons.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-white/[0.018] py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Made for real people</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Easy enough for a first-time user.<br className="hidden sm:block" /> Useful enough for everyday business.
          </h2>
        </div>

        <div className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="glass group rounded-3xl p-7 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-brand-soft ring-1 ring-white/10 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <reason.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-5 font-semibold">{reason.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
