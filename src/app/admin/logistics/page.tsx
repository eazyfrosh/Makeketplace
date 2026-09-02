"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Search } from "lucide-react";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAdminShipments } from "@/lib/logistics/client";
import { SERVICE_LABELS, STATUS_LABELS } from "@/lib/logistics/types";
import type { Shipment } from "@/lib/logistics/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminLogisticsPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!isAdmin) return;
    getAdminShipments()
      .then((data) => setShipments(data.shipments))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter(
      (s) =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.shipmentNumber.toLowerCase().includes(q) ||
        s.sender.name.toLowerCase().includes(q) ||
        s.sender.email.toLowerCase().includes(q) ||
        s.receiver.name.toLowerCase().includes(q),
    );
  }, [shipments, query]);

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Logistics shipments</h1>
      <p className="mt-2 text-muted-foreground">
        Every shipment created across the Logistics Platform. Open one to edit its details, add a
        tracking event, or reply to the customer.
      </p>

      <div className="relative mt-8 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by tracking #, sender, or receiver…"
          className="h-11 pl-9"
        />
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-12"
          title="No shipments found"
          description="Shipments appear here once customers create them on the Logistics Platform."
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tracking #</th>
                <th className="px-4 py-3 font-medium">Sender</th>
                <th className="px-4 py-3 font-medium">Receiver</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer border-t border-white/10 hover:bg-white/[0.02]"
                  onClick={() => (window.location.href = `/admin/logistics/${s.id}`)}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/logistics/${s.id}`} className="inline-flex items-center gap-1.5 font-mono text-xs hover:underline">
                      {s.trackingNumber}
                      {s.unreadForAdmin && <MessageCircle className="size-3.5 text-brand-500" aria-label="Unread message" />}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{s.sender.name}</div>
                    <div className="text-xs text-muted-foreground">{s.sender.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{s.receiver.name}</div>
                    <div className="text-xs text-muted-foreground">{s.receiver.city}, {s.receiver.country}</div>
                  </td>
                  <td className="px-4 py-3">{SERVICE_LABELS[s.serviceType]}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "delivered" ? "default" : "outline"} className="capitalize">
                      {STATUS_LABELS[s.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
