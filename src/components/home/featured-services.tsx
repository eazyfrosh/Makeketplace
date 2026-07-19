import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { services } from "@/lib/data/services";
import { ServiceCard } from "@/components/marketing/service-card";

export function FeaturedServices() {
  const featured = services.slice(0, 6);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-sm font-medium text-primary">Featured</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to launch
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            From full-blown platforms to design and automation — pick a service and
            we&apos;ll take it from spec to production.
          </p>
        </div>
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View all services
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((service, i) => (
          <ServiceCard key={service.slug} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}
