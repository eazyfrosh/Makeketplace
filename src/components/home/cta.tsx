import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-brand px-8 py-16 shadow-[0_35px_100px_-45px_rgba(99,102,241,0.9)] sm:px-16 lg:py-20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75"><CheckCircle2 className="size-4" /> Your next launch starts here</span>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Bring your boldest idea.<br />We&apos;ll bring the build.
            </h2>
            <p className="mt-4 max-w-xl text-white/80">Choose a proven package or tell us what you need. Either way, you&apos;ll get clarity, senior talent, and a launch plan.</p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
            <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90" asChild>
              <Link href="/services">
                Explore the marketplace
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Start a conversation</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
