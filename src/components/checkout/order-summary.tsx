"use client";

import * as React from "react";
import Link from "next/link";
import { Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/store/cart-store";
import { findCoupon } from "@/lib/data/coupons";

export function OrderSummary() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const [couponInput, setCouponInput] = React.useState("");

  const subtotal = items.reduce((sum, item) => sum + item.priceCents, 0);
  const coupon = couponCode ? findCoupon(couponCode) : null;
  const discount = coupon ? Math.round((subtotal * coupon.percentOff) / 100) : 0;
  const total = Math.max(0, subtotal - discount);

  function submitCoupon(e: React.FormEvent) {
    e.preventDefault();
    const found = findCoupon(couponInput);
    if (!found) {
      toast.error("That coupon code isn't valid.");
      return;
    }
    applyCoupon(found.code);
    toast.success(`${found.code} applied — ${found.percentOff}% off`);
    setCouponInput("");
  }

  return (
    <div className="glass sticky top-24 rounded-2xl p-6">
      <h2 className="font-semibold">Order summary</h2>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Your cart is empty.{" "}
          <Link href="/services" className="text-primary hover:underline">
            Browse services
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li key={item.packageId} className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{item.serviceName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.packageName} package · {item.billing === "monthly" ? "/mo" : "one-time"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatPrice(item.priceCents)}</span>
                  <button
                    aria-label="Remove item"
                    onClick={() => removeItem(item.packageId)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={submitCoupon} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                className="h-10 pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
          {coupon && (
            <p className="mt-2 text-xs text-emerald-400">
              {coupon.code} applied — {coupon.percentOff}% off
            </p>
          )}

          <Separator className="my-6" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
