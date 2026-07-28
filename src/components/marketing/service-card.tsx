"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";

import type { Service } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceVisual } from "@/components/marketing/service-visual";
import { BuyNowButton } from "@/components/marketing/buy-now-button";
import { useWishlistStore } from "@/lib/store/wishlist-store";

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  const wishlisted = useWishlistStore((s) => s.has(service.slug));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.06 }}
      className="glass group relative flex h-full flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
    >
      <Link href={`/services/${service.slug}`} className="relative block">
        <ServiceVisual variant={service.heroImage} className="aspect-[16/10] rounded-none border-0 border-b border-white/10" label={`nexova.io/${service.slug}`} />
      </Link>

      <button
        onClick={() => toggle(service.slug)}
        aria-label="Toggle wishlist"
        className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
      >
        <Heart className={cn("size-4", wishlisted && "fill-rose-500 text-rose-500")} />
      </button>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/services/${service.slug}`}>
              <h3 className="font-semibold leading-tight transition-colors group-hover:text-gradient-brand">
                {service.name}
              </h3>
            </Link>
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {service.rating}
            </div>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{service.tagline}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {service.features.slice(0, 3).map((f) => (
            <Badge key={f} variant="soft" className="font-normal">
              {f}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-lg font-semibold">
              {formatPrice(service.startingPriceCents)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/services/${service.slug}`}>Learn more</Link>
            </Button>
            <BuyNowButton
              serviceSlug={service.slug}
              serviceName={service.name}
              priceCents={service.startingPriceCents}
              size="sm"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
