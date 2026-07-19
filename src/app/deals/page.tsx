import { Tag } from "lucide-react";

import { services } from "@/lib/data/services";
import { coupons } from "@/lib/data/coupons";
import { ServiceCard } from "@/components/marketing/service-card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Deals",
  description: "Active coupon codes and top-rated services on Nexova.",
};

export default function DealsPage() {
  const featured = [...services].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Deals</span>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        Active offers
      </h1>

      <div className="mt-8 flex flex-wrap gap-3">
        {coupons.map((c) => (
          <div key={c.code} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
            <Tag className="size-4 text-primary" />
            <div>
              <Badge>{c.code}</Badge>
              <span className="ml-2 text-sm text-muted-foreground">{c.description}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-14 text-2xl font-semibold tracking-tight">Top-rated services</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((service, i) => (
          <ServiceCard key={service.slug} service={service} index={i} />
        ))}
      </div>
    </div>
  );
}
