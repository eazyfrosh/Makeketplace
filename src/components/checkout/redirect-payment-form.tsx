"use client";

import * as React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export function RedirectPaymentForm({
  provider,
  label,
  amountCents,
  email,
  onSuccess,
}: {
  provider: "paystack" | "flutterwave";
  label: string;
  amountCents: number;
  email: string;
  onSuccess: (paymentReference: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, email }),
      });
      const data = await res.json();

      const redirectUrl = data.authorizationUrl ?? data.paymentLink;
      if (!data.demo && redirectUrl) {
        // Leaves the app; the provider redirects back to /checkout/callback,
        // which recovers the (still-persisted) cart and finishes the flow.
        window.location.href = redirectUrl;
        return;
      }

      // Demo mode: simulate a successful redirect-based payment.
      await new Promise((resolve) => setTimeout(resolve, 900));
      onSuccess(`demo_${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass flex items-start gap-3 rounded-xl p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          You&apos;ll be redirected to {label} to complete payment securely. If{" "}
          {provider === "paystack" ? "PAYSTACK_SECRET_KEY" : "FLUTTERWAVE_SECRET_KEY"} isn&apos;t
          configured, this runs as a demo checkout instead.
        </p>
      </div>
      <Button className="w-full" disabled={!email || amountCents < 50 || loading} onClick={handlePay}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Pay with {label} — {formatPrice(amountCents)}
      </Button>
    </div>
  );
}
