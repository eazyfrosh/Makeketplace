"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";

import type { PricingPackage } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store/cart-store";

export function PricingPackages({
  serviceSlug,
  serviceName,
  packages,
}: {
  serviceSlug: string;
  serviceName: string;
  packages: PricingPackage[];
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  function buyNow(pkg: PricingPackage) {
    addItem({
      serviceSlug,
      serviceName,
      packageId: `${serviceSlug}-${pkg.id}`,
      packageName: pkg.name,
      priceCents: pkg.priceCents,
      billing: pkg.billing,
    });
    toast.success(`${pkg.name} package added to your order`);
    router.push("/checkout");
  }

  return (
    <div id="pricing" className="grid gap-6 scroll-mt-24 sm:grid-cols-3">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className={cn(
            "glass relative flex flex-col rounded-2xl p-6",
            pkg.featured && "border-gradient-brand ring-1 ring-primary/40",
          )}
        >
          {pkg.featured && (
            <Badge className="absolute -top-3 left-6">Most popular</Badge>
          )}
          <h3 className="font-semibold">{pkg.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{pkg.tagline}</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-3xl font-semibold">{formatPrice(pkg.priceCents)}</span>
            <span className="text-sm text-muted-foreground">
              {pkg.billing === "monthly" ? "/mo" : "one-time"}
            </span>
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {pkg.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <Button
            className="mt-6"
            variant={pkg.featured ? "default" : "secondary"}
            onClick={() => buyNow(pkg)}
          >
            Buy now
          </Button>
        </div>
      ))}
    </div>
  );
}
