"use client";

import * as React from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck } from "lucide-react";

import { getStripe } from "@/lib/stripe/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

function InnerForm({ onSuccess, disabled }: { onSuccess: () => void; disabled: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setSubmitting(false);
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={disabled || submitting || !stripe}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Pay with Stripe
      </Button>
    </form>
  );
}

export function StripePaymentForm({
  amountCents,
  email,
  onSuccess,
}: {
  amountCents: number;
  email: string;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [simulating, setSimulating] = React.useState(false);
  const stripePromise = React.useMemo(() => getStripe(), []);

  React.useEffect(() => {
    if (amountCents < 50) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/checkout/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.demo) {
          setDemoMode(true);
          setMessage(data.message);
        } else if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [amountCents]);

  function simulatePayment() {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      onSuccess();
    }, 900);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Preparing secure payment…
      </div>
    );
  }

  if (demoMode || !stripePromise) {
    return (
      <div className="space-y-4">
        <div className="glass flex items-start gap-3 rounded-xl p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            {message ??
              "Stripe test-mode keys are not configured on this deployment. This is a demo checkout — no card will be charged."}
          </p>
        </div>
        <Button
          className="w-full"
          disabled={!email || amountCents < 50 || simulating}
          onClick={simulatePayment}
        >
          {simulating && <Loader2 className="size-4 animate-spin" />}
          Simulate payment of {formatPrice(amountCents)}
        </Button>
      </div>
    );
  }

  if (!clientSecret) {
    return <p className="text-sm text-destructive">Couldn&apos;t initialize Stripe. Please try again.</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "night", labels: "floating" } }}
    >
      <InnerForm onSuccess={onSuccess} disabled={!email} />
    </Elements>
  );
}
