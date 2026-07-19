"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Download, FileText, KeyRound, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { getOrdersForUser } from "@/lib/services/orders";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Order } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  React.useEffect(() => {
    if (!user) return;
    getOrdersForUser(user.id).then((data) => {
      setOrders(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
    });
  }, [user]);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("License key copied");
  }

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const purchasedCount = orders.reduce((sum, o) => sum + o.items.length, 0);
  const totalSpent = orders.reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {user.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your purchased services, downloads, and license keys.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/profile">Account settings</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <Package className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{purchasedCount}</div>
          <div className="text-sm text-muted-foreground">Purchased services</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <FileText className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{orders.length}</div>
          <div className="text-sm text-muted-foreground">Invoices</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <KeyRound className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{formatPrice(totalSpent)}</div>
          <div className="text-sm text-muted-foreground">Total spent</div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold">Your purchases</h2>

        {loading ? (
          <div className="mt-6 flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="No purchases yet"
            description="Browse our services and your orders will show up here."
            action={
              <Button asChild>
                <Link href="/services">Browse services</Link>
              </Button>
            }
          />
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="glass rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    Order <span className="font-mono text-foreground">{order.id}</span>
                  </span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="capitalize">{order.provider}</span>
                  <span className="font-medium text-foreground">{formatPrice(order.totalCents)}</span>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.packageId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4"
                    >
                      <div>
                        <div className="font-medium">{item.serviceName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.packageName} package
                        </div>
                        <button
                          onClick={() => copyKey(order.licenseKeys[item.packageId])}
                          className="mt-1 flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
                        >
                          {order.licenseKeys[item.packageId]}
                          <Copy className="size-3" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          <Download className="size-4" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/dashboard/support">Get support</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
