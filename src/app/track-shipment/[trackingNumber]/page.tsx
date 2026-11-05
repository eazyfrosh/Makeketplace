"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Mail, PackageSearch, Send } from "lucide-react";
import { trackPublic } from "@/lib/logistics/client";
import { CarrierThemeScope } from "@/components/logistics/carrier-theme-scope";
import { CarrierLogo } from "@/components/logistics/carrier-logo";
import { StatusBadge } from "@/components/logistics/status-badge";
import { TrackingTimeline } from "@/components/logistics/tracking-timeline";
import { RouteMapPlaceholder } from "@/components/logistics/route-map-placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/logistics/ui/card";
import { Button } from "@/components/logistics/ui/button";
import { Input, Label } from "@/components/logistics/ui/input";
import { LoadingState } from "@/components/logistics/ui/loading-state";
import { EmptyState } from "@/components/logistics/ui/empty-state";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { SERVICE_LABELS } from "@/lib/logistics/types";
import { formatDateLong } from "@/lib/logistics/format";
import { renderShipmentStatusEmail } from "@/lib/logistics/email-templates";
import "@/app/platform/platform-themes.css";

type PublicShipment = Awaited<ReturnType<typeof trackPublic>>["shipment"];
type PublicEvent = Awaited<ReturnType<typeof trackPublic>>["events"][number];

function TrackingEmailCard({ shipment, events }: { shipment: PublicShipment; events: PublicEvent[] }) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientConfirmed, setRecipientConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const inFlight = useRef(false);
  const latestEvent = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const event = latestEvent?.status === shipment.status ? latestEvent : {
    status: shipment.status,
    location: shipment.receiver.city ? `${shipment.receiver.city}, ${shipment.receiver.country}` : shipment.receiver.country,
    description: `Shipment status updated to ${shipment.status.replaceAll("_", " ")}.`,
    timestamp: shipment.updatedAt,
  };
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://eazytool.app").replace(/\/$/, "");
  const preview = renderShipmentStatusEmail({
    shipment: { trackingNumber: shipment.trackingNumber, estimatedDeliveryDate: shipment.estimatedDeliveryDate, receiver: {} },
    event,
    trackingUrl: `${appUrl}/track-shipment/${encodeURIComponent(shipment.trackingNumber)}`,
  });

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !recipientEmail.trim() || !recipientConfirmed) return;
    inFlight.current = true;
    setSending(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/logistics/track/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: shipment.trackingNumber, recipientEmail: recipientEmail.trim(), recipientConfirmed: true }),
      });
      if (response.status === 202) {
        setFeedback({ kind: "success", message: "If this address matches the shipment recipient, we will try to email these tracking details." });
      } else {
        const message = response.status === 429
          ? "Too many email requests. Please wait a few minutes before trying again."
          : response.status === 503
            ? "Tracking emails are unavailable right now. Please try again later."
            : response.status === 400
              ? "Enter a valid recipient email address."
              : "We could not process this request. Please try again.";
        setFeedback({ kind: "error", message });
      }
    } catch {
      setFeedback({ kind: "error", message: "We could not process this request. Please try again." });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return (
    <Card id="email-tracking-details" className="mt-6 scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail size={18} /> Send tracking details by email</CardTitle>
        <p className="text-sm leading-6 text-foreground/60">Preview the update below, then enter the recipient email used for this shipment. We only send to the address on the booking and do not show it here.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="min-w-0">
            <Label htmlFor="tracking-recipient-email">Recipient email</Label>
            <Input
              id="tracking-recipient-email"
              name="recipientEmail"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={recipientEmail}
              onChange={(event) => { setRecipientEmail(event.target.value); setFeedback(null); }}
              required
              maxLength={254}
            />
          </div>
          <label className="flex items-start gap-2 text-xs leading-5 text-foreground/60">
            <input type="checkbox" checked={recipientConfirmed} onChange={(event) => setRecipientConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-[var(--carrier-primary)]" />
            <span>I am the shipment recipient or have permission to request this email.</span>
          </label>
          <Button type="submit" variant="carrier" className="w-full sm:w-auto" disabled={sending || !recipientEmail.trim() || !recipientConfirmed}>
            <Send size={16} /> {sending ? "Requesting…" : "Send Email"}
          </Button>
        </form>
        {feedback && (
          <p className={`mt-3 text-sm leading-6 ${feedback.kind === "error" ? "text-red-600 dark:text-red-400" : "text-foreground/70"}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}
        <div className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-foreground/10 bg-white text-slate-900 shadow-sm">
          <div className="space-y-1 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p><span className="font-semibold">Template:</span> TrackNova shipment update</p>
            <p className="break-all"><span className="font-semibold">To:</span> {recipientEmail.trim() || "Enter the recipient email above"}</p>
            <p className="break-words"><span className="font-semibold">Subject:</span> {preview.subject}</p>
          </div>
          <iframe
            title="Tracking details email preview"
            srcDoc={preview.html}
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            onLoad={(loaded) => {
              const frame = loaded.currentTarget;
              const height = frame.contentDocument?.documentElement.scrollHeight;
              if (height) frame.style.height = `${Math.max(560, height + 20)}px`;
            }}
            className="h-[900px] w-full bg-white sm:h-[700px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}

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
              <h1 className="break-all text-2xl font-bold">{shipment.trackingNumber}</h1>
              <p className="text-sm text-foreground/55">{carrier.name} · {SERVICE_LABELS[shipment.serviceType]}</p>
            </div>
          </div>
          <StatusBadge status={shipment.status} carrierAware />
        </div>
        <a href="#email-tracking-details" className="mb-6 inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/10">
          <Mail size={16} /> Preview and email this update
        </a>

        <Card className="mb-6">
          <CardContent className="p-5">
            <RouteMapPlaceholder
              events={events}
              origin={shipment.sender}
              destination={shipment.receiver}
            />
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

        <TrackingEmailCard key={shipment.trackingNumber} shipment={shipment} events={events} />
      </div>
    </CarrierThemeScope>
  );
}
