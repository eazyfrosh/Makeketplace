"use client";

import { useCartStore } from "@/lib/store/cart-store";
import { findCoupon } from "@/lib/data/coupons";

export function useOrderTotals() {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);
  const coupon = couponCode ? findCoupon(couponCode) : null;
  const discountCents = coupon ? Math.round((subtotalCents * coupon.percentOff) / 100) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);

  return { items, subtotalCents, discountCents, totalCents, couponCode: coupon?.code ?? null };
}
