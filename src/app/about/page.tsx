import Link from "next/link";
import { ArrowRight, Globe2, Rocket, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

const VALUES = [
  {
    icon: Rocket,
    title: "Ship fast, ship well",
    description: "We build on proven foundations so launches take weeks, not quarters — without cutting corners.",
  },
  {
    icon: Users,
    title: "Senior team, every time",
    description: "No juniors learning on your dime — every engagement is staffed by senior engineers and designers.",
  },
  {
    icon: Globe2,
    title: "Built for scale",
    description: "From your first hundred users to millions, every platform we ship is architected to grow with you.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-sm font-medium text-primary">About Nexova</span>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          The studio behind your next launch
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Nexova is a marketplace of premium digital products and services — built by a
          product studio that has shipped banking platforms, travel systems, and
          AI-driven tools for startups and enterprises alike.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {VALUES.map((value) => (
          <div key={value.title} className="glass rounded-2xl p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-brand-soft">
              <value.icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{value.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-16 flex flex-col items-center gap-6 rounded-2xl p-10 text-center">
        <h2 className="text-2xl font-semibold">Ready to see what we can build together?</h2>
        <Button size="lg" asChild>
          <Link href="/services">
            Explore services
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
