"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/store/wishlist-store";

export function WishlistButton({ slug }: { slug: string }) {
  const wishlisted = useWishlistStore((s) => s.has(slug));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <Button variant="secondary" size="lg" onClick={() => toggle(slug)}>
      <Heart className={cn("size-4", wishlisted && "fill-rose-500 text-rose-500")} />
      {wishlisted ? "Saved" : "Save"}
    </Button>
  );
}
