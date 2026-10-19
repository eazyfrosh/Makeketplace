import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { services } from "@/lib/data/services";
import { ServiceCard } from "@/components/marketing/service-card";

export function FeaturedServices() {
  const featuredOrder = ["premium-templates", "airline-booking-platform", "logistics-platform", "banking-platform", "receipt-generator", "email-designer"];
  const featured = featuredOrder.flatMap((slug) => services.filter((service) => service.slug === slug));

  return (
    <section className="home-catalog relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="pointer-events-none absolute -left-40 top-20 -z-10 size-80 rounded-full bg-cyan-400/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -right-36 bottom-20 -z-10 size-96 rounded-full bg-violet-500/[0.07] blur-3xl" />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><span className="h-px w-8 bg-primary/60" />Start here</div>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Pick what you want to create.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Start with a ready-made website, design an email, create a receipt, track a shipment, or explore another simple tool.
          </p>
        </div>
        <Link
          href="/services"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
        >
          View all services
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((service, i) => (
          <ServiceCard key={service.slug} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}
