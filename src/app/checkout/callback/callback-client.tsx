"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useCartStore } from "@/lib/store/cart-store";
import { confirmCheckout } from "@/lib/checkout/confirm";
import { Button } from "@/components/ui/button";
import type { PaymentProvider } from "@/types";

export function CheckoutCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const clear = useCartStore((s) => s.clear);
  const [error, setError] = React.useState<string | null>(null);
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const provider = searchParams.get("provider") as PaymentProvider | null;
    const status = searchParams.get("status"); // flutterwave
    const reference =
      searchParams.get("reference") ?? // paystack
      searchParams.get("transaction_id") ?? // flutterwave
      null;

    if (!provider || (provider === "flutterwave" && status !== "successful")) {
      setError("Payment was not completed.");
      return;
    }
    if (!reference || items.length === 0) {
      setError("We couldn't find your pending order. Please try checking out again.");
      return;
    }

    confirmCheckout({
      provider,
      paymentReference: reference,
      items: items.map((item) => ({ serviceSlug: item.serviceSlug, billing: item.billing })),
      couponCode,
    })
      .then((result) => {
        sessionStorage.setItem(`nexova_order_${result.order.id}`, JSON.stringify(result));
        clear();
        router.replace(`/checkout/success?order=${result.order.id}`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Payment could not be verified."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">We couldn&apos;t complete your order</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-8" asChild>
          <Link href="/checkout">Back to checkout</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Confirming your payment…</p>
    </div>
  );
}
