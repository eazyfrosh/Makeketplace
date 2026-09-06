import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { services } from "@/lib/data/services";
import { ServiceCard } from "@/components/marketing/service-card";

export function FeaturedServices() {
  const featured = services.filter((service) => !service.comingSoon).slice(0, 4);

  return (
    <section className="home-catalog relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="pointer-events-none absolute -left-40 top-20 -z-10 size-80 rounded-full bg-cyan-400/[0.06] blur-3xl" />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><span className="h-px w-8 bg-primary/60" />Start here</div>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Choose a tool and get moving.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Pick the service that matches your next task. Clear pricing, straightforward access, and no unnecessary steps.
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

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((service) => (
          <Link
            key={`quick-${service.slug}`}
            href={`/services/${service.slug}`}
            className="group flex items-center justify-between rounded-xl border border-border/70 bg-background/55 px-4 py-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.06]"
          >
            <span className="font-medium">{service.name}</span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((service, i) => (
          <ServiceCard key={service.slug} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}
