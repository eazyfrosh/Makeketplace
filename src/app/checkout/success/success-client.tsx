"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getOne } from "@/lib/services/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/types";

export function SuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    getOne<Order>("orders", orderId).then((o) => {
      setOrder(o);
      setLoading(false);
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

  if (!order) {
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="size-7 text-emerald-400" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Payment successful</h1>
        <p className="mt-2 text-muted-foreground">
          Order <span className="font-mono text-foreground">{order.id}</span> is confirmed. A
          receipt was sent to {order.email}.
        </p>

        <Separator className="my-8" />

        <div className="space-y-4 text-left">
          {order.items.map((item) => (
            <div
              key={item.packageId}
              className="flex items-center justify-between rounded-xl border border-white/10 p-4"
            >
              <div>
                <div className="text-sm font-medium">{item.serviceName}</div>
                <div className="text-xs text-muted-foreground">{item.packageName} package</div>
                <div className="mt-1 font-mono text-xs text-primary">
                  {order.licenseKeys[item.packageId]}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatPrice(item.priceCents)}</span>
                <button
                  aria-label="Copy license key"
                  onClick={() => copyKey(order.licenseKeys[item.packageId])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

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
