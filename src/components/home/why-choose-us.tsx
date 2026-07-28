"use client";

import { motion } from "framer-motion";
import { Clock, Code2, LifeBuoy, ShieldCheck, Sparkles, Wallet } from "lucide-react";

const REASONS = [
  {
    icon: Code2,
    title: "Senior engineering, always",
    description: "Every project is built by senior engineers and designers — never outsourced to junior contractors.",
  },
  {
    icon: Clock,
    title: "Weeks, not months",
    description: "Kickoff within 48 hours and launch-ready builds in weeks thanks to battle-tested foundations.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    description: "Bank-grade encryption, audit trails, and compliance workflows built into every platform.",
  },
  {
    icon: Wallet,
    title: "Transparent pricing",
    description: "One flat price per service with no hidden fees — know exactly what you're paying for up front.",
  },
  {
    icon: LifeBuoy,
    title: "Real support, real people",
    description: "A dedicated dashboard for tickets, invoices, and updates — never wait on a black-box inbox.",
  },
  {
    icon: Sparkles,
    title: "Built to scale",
    description: "Every product line is architected to grow from your first users to millions of them.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="relative border-y border-white/10 bg-white/[0.015] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium text-primary">Why Nexova</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built like a product studio, priced like a marketplace
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-brand-soft">
                <reason.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{reason.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
