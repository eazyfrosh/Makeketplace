"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import { useCartStore } from "@/lib/store/cart-store";
import { useOrderTotals } from "@/lib/checkout/use-order-totals";
import { createOrder } from "@/lib/services/orders";
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form";
import { RedirectPaymentForm } from "@/components/checkout/redirect-payment-form";
import type { PaymentProvider } from "@/types";

export function CheckoutForm() {
  const router = useRouter();
  const { user } = useAuth();
  const clear = useCartStore((s) => s.clear);
  const { items, totalCents, discountCents, couponCode } = useOrderTotals();
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [provider, setProvider] = React.useState<PaymentProvider>("stripe");
  const [agreed, setAgreed] = React.useState(false);
  const [placing, setPlacing] = React.useState(false);

  React.useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function handleSuccess() {
    if (placing) return;
    setPlacing(true);
    try {
      const order = await createOrder({
        userId: user?.id ?? null,
        email,
        items,
        discountCents,
        couponCode,
        provider,
      });
      clear();
      toast.success("Payment successful — your order is ready.");
      router.push(`/checkout/success?order=${order.id}`);
    } catch {
      toast.error("Something went wrong placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  const disabled = items.length === 0 || !email || !agreed;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-semibold">Payment details</h2>

      <div className="mt-6 space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
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
            <fieldset disabled={disabled} className="disabled:pointer-events-none disabled:opacity-50">
              <StripePaymentForm amountCents={totalCents} email={email} onSuccess={handleSuccess} />
            </fieldset>
          </TabsContent>
          <TabsContent value="paystack">
            <fieldset disabled={disabled} className="disabled:pointer-events-none disabled:opacity-50">
              <RedirectPaymentForm
                provider="paystack"
                label="Paystack"
                amountCents={totalCents}
                email={email}
                onSuccess={handleSuccess}
              />
            </fieldset>
          </TabsContent>
          <TabsContent value="flutterwave">
            <fieldset disabled={disabled} className="disabled:pointer-events-none disabled:opacity-50">
              <RedirectPaymentForm
                provider="flutterwave"
                label="Flutterwave"
                amountCents={totalCents}
                email={email}
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
