"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";

import type { Service } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceVisual } from "@/components/marketing/service-visual";
import { BuyNowButton } from "@/components/marketing/buy-now-button";
import { useWishlistStore } from "@/lib/store/wishlist-store";

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  const wishlisted = useWishlistStore((s) => s.has(service.slug));
  const toggle = useWishlistStore((s) => s.toggle);
  const isSupportTemplates = service.slug === "support-website-templates";
  const primaryHref = isSupportTemplates ? "/support-templates" : `/services/${service.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.06 }}
      className="glass group relative flex h-full flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
    >
      <Link href={primaryHref} className="relative block">
        <ServiceVisual variant={service.heroImage} className="aspect-[16/10] rounded-none border-0 border-b border-white/10" label={`eazytool / ${service.slug}`} />
        {service.comingSoon && <span className="absolute left-3 top-3 rounded-full border border-amber-300/30 bg-amber-300/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-950 shadow-lg">Coming soon</span>}
      </Link>

      <button
        onClick={() => toggle(service.slug)}
        aria-label="Toggle wishlist"
        className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
      >
        <Heart className={cn("size-4", wishlisted && "fill-rose-500 text-rose-500")} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div>
          <div className="flex min-w-0 items-start justify-between gap-2">
            <Link href={primaryHref}>
              <h3 className="break-words font-semibold leading-tight transition-colors group-hover:text-gradient-brand">
                {service.name}
              </h3>
            </Link>
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {service.rating}
            </div>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{service.tagline}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground/80">{service.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {service.features.map((f) => (
            <Badge key={f} variant="soft" className="font-normal">
              {f}
            </Badge>
          ))}
        </div>

        <div className="mt-auto border-t border-border/60 pt-4">
          <div className="grid w-full grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" className="w-full px-2" asChild>
              <Link href={primaryHref}>{isSupportTemplates ? "Preview gallery" : "Learn more"}</Link>
            </Button>
            {isSupportTemplates ? (
              <Button size="sm" className="w-full px-2" asChild>
                <Link href="/support-templates">Browse Templates</Link>
              </Button>
            ) : service.comingSoon ? (
              <Button size="sm" className="w-full px-2" disabled>Coming soon</Button>
            ) : (
              <BuyNowButton
                serviceSlug={service.slug}
                serviceName={service.name}
                size="sm"
                className="w-full px-2"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
