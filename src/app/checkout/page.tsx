import type { Metadata } from "next";

import { OrderSummary } from "@/components/checkout/order-summary";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase securely with Stripe, Paystack, or Flutterwave.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Review your order and choose how you&apos;d like to pay.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <CheckoutForm />
        <OrderSummary />
      </div>
    </div>
  );
}
