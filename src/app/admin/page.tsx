"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { services } from "@/lib/data/services";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Order } from "@/types";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAdmin) return;
    getAuthHeaders().then((headers) => {
      fetch("/api/orders/admin-list", { headers })
        .then((res) => (res.ok ? res.json() : { orders: [] }))
        .then((data) => setOrders(data.orders ?? []))
        .finally(() => setLoading(false));
    });
  }, [isAdmin]);

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const revenue = orders.reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin overview</h1>
          <p className="mt-2 text-muted-foreground">
            Sales analytics and order management. Service catalog editing, screenshot uploads,
            and discount creation are on the roadmap for the next iteration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link href="/admin/licenses">Manage licenses</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/admin/banking">Banking users</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/admin/affiliates">Affiliates</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="text-2xl font-semibold">{orders.length}</div>
          <div className="text-sm text-muted-foreground">Total orders</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-2xl font-semibold">{formatPrice(revenue)}</div>
          <div className="text-sm text-muted-foreground">Total revenue</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-2xl font-semibold">{services.length}</div>
          <div className="text-sm text-muted-foreground">Active services</div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold">Recent orders</h2>
        {loading ? (
          <div className="mt-6 flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState className="mt-6" title="No orders yet" description="Orders will appear here as customers check out." />
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                    <td className="px-4 py-3">{order.email}</td>
                    <td className="px-4 py-3 capitalize">{order.provider}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === "paid" ? "default" : "outline"} className="capitalize">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{formatPrice(order.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
