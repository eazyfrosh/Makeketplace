"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { trackPublic } from "@/lib/logistics/client";
import { CarrierThemeScope } from "@/components/logistics/carrier-theme-scope";
import { CarrierLogo } from "@/components/logistics/carrier-logo";
import { StatusBadge } from "@/components/logistics/status-badge";
import { TrackingTimeline } from "@/components/logistics/tracking-timeline";
import { RouteMapPlaceholder } from "@/components/logistics/route-map-placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/logistics/ui/card";
import { Button } from "@/components/logistics/ui/button";
import { LoadingState } from "@/components/logistics/ui/loading-state";
import { EmptyState } from "@/components/logistics/ui/empty-state";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { SERVICE_LABELS } from "@/lib/logistics/types";
import { formatDateLong } from "@/lib/logistics/format";
import "@/app/platform/platform-themes.css";

type PublicShipment = Awaited<ReturnType<typeof trackPublic>>["shipment"];
type PublicEvent = Awaited<ReturnType<typeof trackPublic>>["events"][number];

export default function PublicTrackingResultPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const [shipment, setShipment] = useState<PublicShipment | null | undefined>(undefined);
  const [events, setEvents] = useState<PublicEvent[]>([]);

  useEffect(() => {
    trackPublic(decodeURIComponent(trackingNumber))
      .then((data) => {
        setShipment(data.shipment);
        setEvents(data.events);
      })
      .catch(() => setShipment(null));
  }, [trackingNumber]);

  if (shipment === undefined) {
    return (
      <div className="logistics-theme">
        <LoadingState label="Looking up shipment…" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="logistics-theme">
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6 lg:px-8">
          <EmptyState
            icon={<PackageSearch size={22} />}
            title="Shipment not found"
            description="Double-check the tracking number and try again."
          />
          <Link href="/track-shipment">
            <Button className="mt-6">Try another tracking number</Button>
          </Link>
        </div>
      </div>
    );
  }

  const carrier = getCarrier(shipment.carrierCode);

  return (
    <CarrierThemeScope carrierCode={shipment.carrierCode} className="logistics-theme">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CarrierLogo carrier={shipment.carrierCode} size={44} />
            <div>
              <h1 className="text-2xl font-bold">{shipment.trackingNumber}</h1>
              <p className="text-sm text-foreground/55">{carrier.name} · {SERVICE_LABELS[shipment.serviceType]}</p>
            </div>
          </div>
          <StatusBadge status={shipment.status} carrierAware />
        </div>

        <Card className="mb-6">
          <CardContent className="p-5">
            <RouteMapPlaceholder events={events} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Origin</CardTitle></CardHeader>
            <CardContent className="text-sm text-foreground/70">
              {shipment.sender.city}, {shipment.sender.country}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Destination</CardTitle></CardHeader>
            <CardContent className="text-sm text-foreground/70">
              {shipment.receiver.city}, {shipment.receiver.country}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader><CardTitle>Estimated delivery</CardTitle></CardHeader>
          <CardContent className="text-sm text-foreground/70">{formatDateLong(shipment.estimatedDeliveryDate)}</CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>Tracking history</CardTitle></CardHeader>
          <CardContent>
            <TrackingTimeline events={events} carrierAware />
          </CardContent>
        </Card>
      </div>
    </CarrierThemeScope>
  );
}
