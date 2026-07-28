"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";

export function BuyNowButton({
  serviceSlug,
  serviceName,
  priceCents,
  size = "default",
  variant = "default",
  className,
}: {
  serviceSlug: string;
  serviceName: string;
  priceCents: number;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary";
  className?: string;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  function buyNow() {
    addItem({
      serviceSlug,
      serviceName,
      packageId: serviceSlug,
      packageName: serviceName,
      priceCents,
      billing: "one-time",
    });
    toast.success(`${serviceName} added to your order`);
    router.push("/checkout");
  }

  return (
    <Button size={size} variant={variant} className={className} onClick={buyNow}>
      Buy now
    </Button>
  );
}
