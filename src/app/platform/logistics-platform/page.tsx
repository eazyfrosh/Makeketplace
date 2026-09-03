"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  PackagePlus,
  PackageSearch,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { getMyShipments, getTracknovaSsoUrl } from "@/lib/logistics/client";
import { CarrierLogo } from "@/components/logistics/carrier-logo";
import { StatusBadge } from "@/components/logistics/status-badge";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { formatDateShort } from "@/lib/logistics/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Shipment } from "@/lib/logistics/types";

const TERMINAL_STATUSES = new Set<Shipment["status"]>(["delivered", "cancelled", "returned", "failed_delivery"]);

export default function LogisticsDashboardPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[] | null>(null);
  const [openingTracknova, setOpeningTracknova] = useState(false);

  useEffect(() => {
    getMyShipments()
      .then(({ shipments }) => setShipments(shipments))
      .catch(() => setShipments([]));
  }, []);

  async function handleOpenTracknova() {
    setOpeningTracknova(true);
    try {
      const { redirectUrl } = await getTracknovaSsoUrl();
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open TrackNova.");
    } finally {
      setOpeningTracknova(false);
    }
  }

  const activeCount = shipments?.filter((s) => !TERMINAL_STATUSES.has(s.status)).length ?? 0;
  const deliveredCount = shipments?.filter((s) => s.status === "delivered").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
            <p className="text-muted-foreground mt-1 text-sm">TrackNova — create and track your shipments.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={openingTracknova} onClick={handleOpenTracknova}>
                {openingTracknova ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
                Open in TrackNova
              </Button>
              {user?.role === "admin" && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/logistics">
                    <ShieldCheck className="size-3.5" />
                    Open Admin
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/track-shipment">
                  <PackageSearch className="size-3.5" />
                  Public tracking
                </Link>
              </Button>
            </div>
          </div>
          {shipments && (
            <Card className="border-primary/20 bg-primary/5 py-3">
              <CardContent className="flex items-center gap-3 px-4">
                <div>
                  <p className="text-muted-foreground text-xs">Active shipments</p>
                  <p className="text-xl font-semibold">{activeCount}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/platform/logistics-platform/shipments/new"
            className="border-border/60 bg-card hover:border-primary/40 hover:shadow-md flex w-24 flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all"
          >
            <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
              <PackagePlus className="size-5" />
            </span>
            <span className="text-xs font-medium">New shipment</span>
          </Link>
          <Link
            href="/track-shipment"
            className="border-border/60 bg-card hover:border-primary/40 hover:shadow-md flex w-24 flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all"
          >
            <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
              <Truck className="size-5" />
            </span>
            <span className="text-xs font-medium">Track a package</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin/logistics"
              className="border-border/60 bg-card hover:border-primary/40 hover:shadow-md flex w-24 flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all"
            >
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <ShieldCheck className="size-5" />
              </span>
              <span className="text-xs font-medium">Open Admin</span>
            </Link>
          )}
        </div>

        {shipments && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Total shipments</div>
                <div className="mt-1 text-2xl font-semibold">{shipments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">In progress</div>
                <div className="mt-1 text-2xl font-semibold">{activeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Delivered</div>
                <div className="mt-1 text-2xl font-semibold">{deliveredCount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your shipments</CardTitle>
          </CardHeader>
          <CardContent className="divide-border/60 divide-y">
            {shipments === null ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="my-1.5 h-14" />)
            ) : shipments.length === 0 ? (
              <EmptyState
                title="No shipments yet"
                description="Create your first shipment to get a tracking number."
                action={
                  <Button asChild>
                    <Link href="/platform/logistics-platform/shipments/new">
                      <PackagePlus className="size-3.5" /> New shipment
                    </Link>
                  </Button>
                }
              />
            ) : (
              shipments.map((shipment) => {
                const carrier = getCarrier(shipment.carrierCode);
                return (
                  <Link
                    key={shipment.id}
                    href={`/platform/logistics-platform/shipments/${shipment.id}`}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <CarrierLogo carrier={shipment.carrierCode} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {shipment.receiver.city}, {shipment.receiver.country}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {carrier.name} · {shipment.trackingNumber} · Est. {formatDateShort(shipment.estimatedDeliveryDate)}
                      </p>
                    </div>
                    <StatusBadge status={shipment.status} />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
