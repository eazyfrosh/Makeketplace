"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, PackagePlus } from "lucide-react";
import { getMyShipments } from "@/lib/logistics/client";
import { CarrierLogo } from "@/components/logistics/carrier-logo";
import { StatusBadge } from "@/components/logistics/status-badge";
import { Button } from "@/components/logistics/ui/button";
import { LoadingState } from "@/components/logistics/ui/loading-state";
import { EmptyState } from "@/components/logistics/ui/empty-state";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { formatDateShort } from "@/lib/logistics/format";
import type { Shipment } from "@/lib/logistics/types";

export default function LogisticsDashboardPage() {
  const [shipments, setShipments] = useState<Shipment[] | null>(null);

  useEffect(() => {
    getMyShipments()
      .then(({ shipments }) => setShipments(shipments))
      .catch(() => setShipments([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="mt-1 text-sm text-foreground/60">TrackNova — create and track your shipments.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/track-shipment">
            <Button variant="outline"><Package size={15} /> Public tracking</Button>
          </Link>
          <Link href="/platform/logistics-platform/shipments/new">
            <Button><PackagePlus size={15} /> New shipment</Button>
          </Link>
        </div>
      </div>

      {shipments === null ? (
        <LoadingState label="Loading your shipments…" />
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={<Package size={22} />}
          title="No shipments yet"
          description="Create your first shipment to get a tracking number."
          action={
            <Link href="/platform/logistics-platform/shipments/new">
              <Button><PackagePlus size={15} /> New shipment</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => {
            const carrier = getCarrier(shipment.carrierCode);
            return (
              <Link
                key={shipment.id}
                href={`/platform/logistics-platform/shipments/${shipment.id}`}
                className="flex items-center gap-4 rounded-2xl border border-black/8 bg-white p-4 transition hover:border-black/15 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
              >
                <CarrierLogo carrier={shipment.carrierCode} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {shipment.receiver.city}, {shipment.receiver.country}
                  </p>
                  <p className="truncate text-xs text-foreground/50">
                    {carrier.name} · {shipment.trackingNumber} · Est. {formatDateShort(shipment.estimatedDeliveryDate)}
                  </p>
                </div>
                <StatusBadge status={shipment.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
