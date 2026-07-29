"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import { useCartStore } from "@/lib/store/cart-store";
import { useOrderTotals } from "@/lib/checkout/use-order-totals";
import { confirmCheckout } from "@/lib/checkout/confirm";
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form";
import { RedirectPaymentForm } from "@/components/checkout/redirect-payment-form";
import type { PaymentProvider } from "@/types";

export function CheckoutForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const clear = useCartStore((s) => s.clear);
  const { items, couponCode, totalCents } = useOrderTotals();
  const [provider, setProvider] = React.useState<PaymentProvider>("stripe");
  const [agreed, setAgreed] = React.useState(false);
  const [placing, setPlacing] = React.useState(false);

  async function handleSuccess(paymentReference: string) {
    if (placing) return;
    setPlacing(true);
    try {
      const result = await confirmCheckout({
        provider,
        paymentReference,
        items: items.map((item) => ({ serviceSlug: item.serviceSlug, billing: item.billing })),
        couponCode,
      });
      sessionStorage.setItem(`nexova_order_${result.order.id}`, JSON.stringify(result));
      clear();
      toast.success("Payment successful — your license is ready.");
      router.push(`/checkout/success?order=${result.order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <h2 className="font-semibold">Sign in to check out</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Licenses are tied to your account so they show up in your dashboard. Sign in or create an
          account to continue.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/auth/login?next=/checkout">Log in</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/auth/signup?next=/checkout">Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const disabled = items.length === 0 || !agreed || authLoading;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-semibold">Payment details</h2>

      <div className="mt-6 space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" value={user?.email ?? ""} disabled />
        <p className="text-xs text-muted-foreground">
          Your license keys and invoice will be sent here.
        </p>
      </div>

      <div className="mt-6 flex items-start gap-2.5">
        <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
        <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
          I agree to the{" "}
          <span className="text-foreground underline underline-offset-2">Terms of Service</span>{" "}
          and{" "}
          <span className="text-foreground underline underline-offset-2">Privacy Policy</span>.
        </Label>
      </div>

      <Tabs
        value={provider}
        onValueChange={(v) => setProvider(v as PaymentProvider)}
        className="mt-8"
      >
        <TabsList className="w-full">
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="paystack">Paystack</TabsTrigger>
          <TabsTrigger value="flutterwave">Flutterwave</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="stripe">
            <fieldset disabled={disabled || placing} className="disabled:pointer-events-none disabled:opacity-50">
              <StripePaymentForm
                amountCents={totalCents}
                email={user?.email ?? ""}
                onSuccess={handleSuccess}
              />
            </fieldset>
          </TabsContent>
          <TabsContent value="paystack">
            <fieldset disabled={disabled || placing} className="disabled:pointer-events-none disabled:opacity-50">
              <RedirectPaymentForm
                provider="paystack"
                label="Paystack"
                amountCents={totalCents}
                email={user?.email ?? ""}
                onSuccess={handleSuccess}
              />
            </fieldset>
          </TabsContent>
          <TabsContent value="flutterwave">
            <fieldset disabled={disabled || placing} className="disabled:pointer-events-none disabled:opacity-50">
              <RedirectPaymentForm
                provider="flutterwave"
                label="Flutterwave"
                amountCents={totalCents}
                email={user?.email ?? ""}
                onSuccess={handleSuccess}
              />
            </fieldset>
          </TabsContent>
        </div>
      </Tabs>

      {items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Add a service package to your cart before checking out.
        </p>
      )}
    </div>
  );
}
