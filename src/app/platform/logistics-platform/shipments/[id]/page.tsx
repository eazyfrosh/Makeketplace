"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, PlusCircle, Send } from "lucide-react";
import { getShipment, addTrackingEvent, getShipmentMessages, sendShipmentMessage } from "@/lib/logistics/client";
import { cn } from "@/lib/utils";
import { CarrierThemeScope } from "@/components/logistics/carrier-theme-scope";
import { CarrierLogo } from "@/components/logistics/carrier-logo";
import { StatusBadge } from "@/components/logistics/status-badge";
import { TrackingTimeline } from "@/components/logistics/tracking-timeline";
import { RouteMapPlaceholder } from "@/components/logistics/route-map-placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/logistics/ui/card";
import { Button } from "@/components/logistics/ui/button";
import { Input, Label, Select, Textarea } from "@/components/logistics/ui/input";
import { LoadingState } from "@/components/logistics/ui/loading-state";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { SERVICE_LABELS, SHIPMENT_STATUSES, STATUS_LABELS } from "@/lib/logistics/types";
import { formatCurrency, formatDateLong } from "@/lib/logistics/format";
import type { Shipment, ShipmentMessage, ShipmentStatus, TrackingEvent } from "@/lib/logistics/types";

interface EventFormValues {
  status: ShipmentStatus;
  location: string;
  description: string;
  notes?: string;
}

const MESSAGE_POLL_MS = 4000;

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ShipmentChatCard({ shipmentId }: { shipmentId: string }) {
  const [messages, setMessages] = useState<ShipmentMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const data = await getShipmentMessages(shipmentId);
        if (!cancelled) setMessages(data.messages);
      } catch {
        // Keep last known messages on a transient failure; polling retries.
      }
    }
    poll();
    const interval = setInterval(poll, MESSAGE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [shipmentId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    const toSend = text.trim();
    setText("");
    try {
      const { message } = await sendShipmentMessage(shipmentId, toSend);
      setMessages((m) => [...m, message]);
    } catch (err) {
      setText(toSend);
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={16} /> Message support about this shipment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto rounded-xl bg-black/[0.03] p-4 dark:bg-white/5">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/40">
              Ask a question about this shipment and our support team will reply here.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex", m.senderRole === "customer" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    m.senderRole === "customer" ? "bg-brand-600 text-white" : "bg-white text-foreground dark:bg-white/10"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn("mt-1 text-[10px]", m.senderRole === "customer" ? "text-white/60" : "text-foreground/40")}>
                    {m.senderRole === "admin" ? `${m.senderName} · ` : ""}
                    {formatMessageTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-3 flex items-center gap-2"
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
          <Button type="submit" variant="carrier" size="icon" disabled={sending || !text.trim()} aria-label="Send message">
            <Send size={15} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<Shipment | null | undefined>(undefined);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getShipment(id);
      setShipment(data.shipment);
      setEvents(data.events);
    } catch {
      setShipment(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const { register, handleSubmit, reset } = useForm<EventFormValues>({
    defaultValues: { status: "pending", location: "", description: "" },
  });

  async function onSubmit(values: EventFormValues) {
    setSubmitting(true);
    try {
      await addTrackingEvent(id, values);
      toast.success("Tracking event added");
      reset({ status: values.status, location: "", description: "", notes: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  }

  if (shipment === undefined) return <LoadingState label="Loading shipment…" />;
  if (!shipment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Shipment not found</h1>
        <Link href="/platform/logistics-platform"><Button className="mt-6">Back to shipments</Button></Link>
      </div>
    );
  }

  const carrier = getCarrier(shipment.carrierCode);

  return (
    <CarrierThemeScope carrierCode={shipment.carrierCode} className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/platform/logistics-platform" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground">
        <ArrowLeft size={14} /> All shipments
      </Link>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sender</CardTitle></CardHeader>
          <CardContent className="text-sm text-foreground/70">
            <p className="font-medium text-foreground">{shipment.sender.name}</p>
            <p>{shipment.sender.address}</p>
            <p>{shipment.sender.city}, {shipment.sender.country} {shipment.sender.postalCode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Receiver</CardTitle></CardHeader>
          <CardContent className="text-sm text-foreground/70">
            <p className="font-medium text-foreground">{shipment.receiver.name}</p>
            <p>{shipment.receiver.address}</p>
            <p>{shipment.receiver.city}, {shipment.receiver.country} {shipment.receiver.postalCode}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Package &amp; cost</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-foreground/50">Weight</p>
            <p className="font-medium">{shipment.package.weightKg} kg</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Dimensions</p>
            <p className="font-medium">{shipment.package.lengthCm}×{shipment.package.widthCm}×{shipment.package.heightCm} cm</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Est. delivery</p>
            <p className="font-medium">{formatDateLong(shipment.estimatedDeliveryDate)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Shipping cost</p>
            <p className="font-medium">{formatCurrency(shipment.shippingCost)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Tracking history</CardTitle></CardHeader>
        <CardContent>
          <TrackingTimeline events={events} carrierAware />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Add a tracking event</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Status</Label>
              <Select {...register("status")}>
                {SHIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input {...register("location", { required: true })} placeholder="Memphis, TN sorting hub" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Input {...register("description", { required: true })} placeholder="Package arrived at sorting facility" />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} {...register("notes")} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={submitting} variant="carrier">
                <PlusCircle size={15} /> {submitting ? "Adding…" : "Add event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ShipmentChatCard shipmentId={shipment.id} />
    </CarrierThemeScope>
  );
}
