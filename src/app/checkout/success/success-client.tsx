"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ConfirmCheckoutResult } from "@/lib/checkout/confirm";

export function SuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [result, setResult] = React.useState<ConfirmCheckoutResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const cached = sessionStorage.getItem(`nexova_order_${orderId}`);
    if (cached) {
      setResult(JSON.parse(cached));
      setLoading(false);
      return;
    }

    getAuthHeaders().then((headers) => {
      fetch(`/api/checkout/order/${orderId}`, { headers })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setResult(data))
        .finally(() => setLoading(false));
    });
  }, [orderId]);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("License key copied");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">We couldn&apos;t find that order</h1>
        <p className="mt-2 text-muted-foreground">
          It may have expired, or the link is incorrect.
        </p>
        <Button className="mt-8" asChild>
          <Link href="/services">Browse services</Link>
        </Button>
      </div>
    );
  }

  const { order, licenses } = result;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="size-7 text-emerald-400" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Payment successful</h1>
        <p className="mt-2 text-muted-foreground">
          Order <span className="font-mono text-foreground">{order.id}</span> is confirmed. Your
          license key{licenses.length > 1 ? "s were" : " was"} emailed to you.
        </p>

        <Separator className="my-8" />

        <div className="space-y-4 text-left">
          {licenses.map((license) => (
            <div
              key={license.serviceSlug}
              className="flex items-center justify-between rounded-xl border border-white/10 p-4"
            >
              <div>
                <div className="text-sm font-medium">{license.serviceName}</div>
                <div className="mt-1 font-mono text-xs text-primary">{license.licenseKey}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Copy license key"
                  onClick={() => copyKey(license.licenseKey)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">Total paid: {formatPrice(order.totalCents)}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/services">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
