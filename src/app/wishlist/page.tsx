"use client";

import Link from "next/link";

import { useWishlistStore } from "@/lib/store/wishlist-store";
import { services } from "@/lib/data/services";
import { ServiceCard } from "@/components/marketing/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const slugs = useWishlistStore((s) => s.slugs);
  const saved = services.filter((s) => slugs.includes(s.slug));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your wishlist</h1>
      <p className="mt-2 text-muted-foreground">Services you&apos;ve saved for later.</p>

      {saved.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Your wishlist is empty"
          description="Tap the heart icon on any service to save it here."
          action={
            <Button asChild>
              <Link href="/services">Browse services</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((service, i) => (
            <ServiceCard key={service.slug} service={service} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
