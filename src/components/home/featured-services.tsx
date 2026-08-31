import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { services } from "@/lib/data/services";
import { ServiceCard } from "@/components/marketing/service-card";

export function FeaturedServices() {
  const featured = services.slice(0, 6);

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="pointer-events-none absolute -left-40 top-20 -z-10 size-80 rounded-full bg-cyan-400/[0.06] blur-3xl" />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The marketplace</span>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Start with something proven.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Explore complete platforms and specialist services designed to shorten the distance from idea to launch.
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
