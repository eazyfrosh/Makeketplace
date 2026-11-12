"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Mail, MessageCircle, Pencil, PlusCircle, RefreshCw, Send } from "lucide-react";
import { getShipment, addTrackingEvent, getShipmentEmailNotifications, getShipmentMessages, sendShipmentMessage, sendShipmentStatusEmail } from "@/lib/logistics/client";
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
import { renderShipmentStatusEmail } from "@/lib/logistics/email-templates";
import { getTrackNovaTrackingUrl } from "@/lib/logistics/tracking-url";
import { TRACKING_EVENT_DESCRIPTION_TEMPLATES } from "@/lib/logistics/tracking-event-templates";
import type { Shipment, ShipmentEmailNotification, ShipmentMessage, ShipmentStatus, TrackingEvent } from "@/lib/logistics/types";

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

function createEmailRequestId() {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replaceAll("-", "") : `${Date.now()}${Math.random().toString(36).slice(2)}`;
  return `logemail_${random}`;
}

function ShipmentEmailCard({ shipment, events }: { shipment: Shipment; events: TrackingEvent[] }) {
  const sortedEvents = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const [recipientEmail, setRecipientEmail] = useState(shipment.receiver.email);
  const [recipientName, setRecipientName] = useState(shipment.receiver.name);
  const [eventId, setEventId] = useState(sortedEvents[0]?.id ?? "current");
  const [emailMessage, setEmailMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState<ShipmentEmailNotification[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [uncertainSend, setUncertainSend] = useState(false);
  const pendingRequest = useRef<{ recipientEmail: string; recipientName: string; message: string; eventId?: string; requestId: string; recipientConfirmed: true } | null>(null);
  const selectedEvent = sortedEvents.find((event) => event.id === eventId);
  const previewEvent: TrackingEvent = selectedEvent ?? {
    id: `current_${shipment.id}`,
    shipmentId: shipment.id,
    status: shipment.status,
    location: shipment.receiver.city ? `${shipment.receiver.city}, ${shipment.receiver.country}` : shipment.receiver.country,
    description: `Shipment status updated to ${shipment.status.replaceAll("_", " ")}.`,
    timestamp: shipment.updatedAt,
  };
  const defaultEmailMessage = selectedEvent?.description || previewEvent.description || "";
  const effectiveEmailMessage = emailMessage || defaultEmailMessage;
  const preview = renderShipmentStatusEmail({
    shipment,
    event: previewEvent,
    trackingUrl: getTrackNovaTrackingUrl(shipment.trackingNumber),
    recipientName,
    message: effectiveEmailMessage,
  });

  const refreshEmailHistory = useCallback(async () => {
    const result = await getShipmentEmailNotifications(shipment.id);
    setNotifications(result.notifications);
    setEmailConfigured(result.emailConfigured);
    setHistoryError("");
    return result.notifications;
  }, [shipment.id]);

  useEffect(() => {
    setRecipientEmail(shipment.receiver.email);
    setConfirmed(false);
    setUncertainSend(false);
    pendingRequest.current = null;
  }, [shipment.id, shipment.receiver.email]);

  useEffect(() => {
    refreshEmailHistory().catch(() => {
      setEmailConfigured(null);
      setHistoryError("Email setup and history could not be checked. Try refreshing this section.");
    });
  }, [refreshEmailHistory]);

  useEffect(() => {
    if (sortedEvents[0] && !sortedEvents.some((event) => event.id === eventId)) setEventId(sortedEvents[0].id);
  }, [eventId, sortedEvents]);

  async function handleSend() {
    if (sending || !recipientEmail.trim() || !confirmed || emailConfigured !== true) return;
    if (recipientEmail.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      toast.error("Enter a valid recipient email address.");
      return;
    }
    const request = pendingRequest.current ?? {
      recipientEmail: recipientEmail.trim(),
      recipientName: recipientName.trim(),
      message: effectiveEmailMessage.trim(),
      eventId: selectedEvent?.id,
      requestId: createEmailRequestId(),
      recipientConfirmed: true as const,
    };
    pendingRequest.current = request;
    setSending(true);
    try {
      const result = await sendShipmentStatusEmail(shipment.id, request);
      if (result.notification.status === "failed") {
        pendingRequest.current = null;
        setUncertainSend(false);
        toast.error("The email was not accepted. Check the recipient and try a new send.");
      } else if (result.notification.status === "pending") {
        setUncertainSend(true);
        toast.message("The email request is still being processed. Retrying will check the same request.");
      } else {
        pendingRequest.current = null;
        setUncertainSend(false);
        setConfirmed(false);
        toast.success(`Email accepted for delivery to ${request.recipientEmail}.`);
      }
      await refreshEmailHistory().catch(() => setHistoryError("Email history could not be refreshed."));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (["Enter a valid recipient email address.", "The selected tracking update was not found."].includes(message)) {
        pendingRequest.current = null;
        setUncertainSend(false);
        toast.error(message);
        return;
      }
      setUncertainSend(true);
      const latest = await refreshEmailHistory().catch(() => [] as ShipmentEmailNotification[]);
      const record = latest.find((item) => item.id === request.requestId);
      if (record?.status === "failed") {
        pendingRequest.current = null;
        setUncertainSend(false);
        toast.error("The email was not accepted. Please try a new send.");
      } else if (record && record.status !== "pending") {
        pendingRequest.current = null;
        setUncertainSend(false);
        setConfirmed(false);
        toast.success(`Email accepted for delivery to ${request.recipientEmail}.`);
      } else {
        toast.error("We could not confirm this email request. Retry checks the same request to avoid sending it twice.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail size={17} /> Email a shipment update
        </CardTitle>
        <p className="text-sm text-foreground/55">Choose a tracking update, review the exact email, then send it to the recipient.</p>
      </CardHeader>
      <CardContent>
        {emailConfigured === false && <p className="mb-4 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900">Email sending is not configured yet. You can preview the message, but sending is unavailable.</p>}
        {emailConfigured === null && <p className="mb-4 rounded-xl border border-foreground/10 p-3 text-sm text-foreground/60">Checking email setup…</p>}
        {historyError && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900"><span>{historyError}</span><Button type="button" size="sm" variant="outline" onClick={() => void refreshEmailHistory().catch(() => setHistoryError("Email setup and history could not be checked."))}>Try again</Button></div>}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div>
              <Label htmlFor={`recipient-email-${shipment.id}`}>Recipient email</Label>
              <Input id={`recipient-email-${shipment.id}`} type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} placeholder="customer@example.com" autoComplete="email" disabled={uncertainSend} />
              <p className="mt-1.5 text-xs text-foreground/45">The receiver&apos;s email is filled in automatically, but you can change it.</p>
            </div>
            <div>
              <Label htmlFor={`recipient-name-${shipment.id}`}>Recipient name</Label>
              <Input id={`recipient-name-${shipment.id}`} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Customer name" maxLength={120} disabled={uncertainSend} />
            </div>
            <div>
              <Label htmlFor={`tracking-update-${shipment.id}`}>Tracking update</Label>
              <Select id={`tracking-update-${shipment.id}`} value={eventId} onChange={(event) => setEventId(event.target.value)} disabled={uncertainSend}>
                {sortedEvents.length === 0 ? (
                  <option value="current">Current status — {STATUS_LABELS[shipment.status]}</option>
                ) : (
                  sortedEvents.map((event) => <option key={event.id} value={event.id}>{STATUS_LABELS[event.status]} — {event.location}</option>)
                )}
              </Select>
            </div>
            <div>
              <Label htmlFor={`email-message-${shipment.id}`}>Email message</Label>
              <Textarea id={`email-message-${shipment.id}`} rows={4} value={effectiveEmailMessage} onChange={(event) => setEmailMessage(event.target.value)} maxLength={2000} disabled={uncertainSend} />
              <p className="mt-1 text-xs text-foreground/45">This message appears in the email and its preview.</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-foreground/10 bg-black/[0.02] p-3.5 dark:bg-white/[0.03]">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-[var(--carrier-primary)]" />
              <span className="text-xs leading-5 text-foreground/65">I confirm this recipient is connected to the shipment and can receive its status updates.</span>
            </label>
            {uncertainSend && <p className="text-xs leading-5 text-amber-700">The last request has not been confirmed. Checking it again uses the same request so it cannot send a duplicate email.</p>}
            <Button type="button" variant="carrier" className="w-full sm:w-auto" disabled={sending || !confirmed || !recipientEmail.trim() || emailConfigured !== true} onClick={handleSend}>
              {sending ? <><span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Checking…</> : <><Send size={15} /> {uncertainSend ? "Check the same email request" : "Send status email"}</>}
            </Button>
            <p className="text-xs leading-5 text-foreground/50">An accepted email is handed to the email provider. This does not confirm that it reached the inbox.</p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-2xl border border-foreground/10 bg-white text-slate-900 shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-xs text-slate-600"><span className="font-semibold">Email preview</span><span className="mt-1 block break-words">Subject: {preview.subject}</span></div>
            <iframe title="Shipment status email preview" srcDoc={preview.html} sandbox="" referrerPolicy="no-referrer" className="h-[650px] w-full bg-white" />
          </div>
        </div>
        <div className="mt-6 border-t border-foreground/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Recent email requests</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => void refreshEmailHistory().catch(() => setHistoryError("Email history could not be refreshed."))}><RefreshCw size={14} /> Refresh</Button>
          </div>
          {notifications.length === 0 ? <p className="mt-3 text-sm text-foreground/50">No shipment emails have been requested yet.</p> : (
            <ul className="mt-3 space-y-2">
              {notifications.slice(0, 10).map((notification) => (
                <li key={notification.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-foreground/10 p-3 text-xs">
                  <div className="min-w-0"><p className="break-all font-medium">{notification.recipientEmail}</p><p className="mt-1 text-foreground/50">{new Date(notification.createdAt).toLocaleString()} · {STATUS_LABELS[notification.shipmentStatus]}</p></div>
                  <span className="rounded-full bg-black/5 px-2.5 py-1 font-semibold dark:bg-white/10">{notification.status === "pending" ? "Processing" : notification.status === "failed" ? "Failed" : "Accepted for delivery"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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

  const { register, handleSubmit, reset, watch, setValue } = useForm<EventFormValues>({
    defaultValues: { status: "pending", location: "", description: TRACKING_EVENT_DESCRIPTION_TEMPLATES.pending },
  });
  const selectedEventStatus = watch("status");

  useEffect(() => {
    setValue("description", TRACKING_EVENT_DESCRIPTION_TEMPLATES[selectedEventStatus], { shouldDirty: true });
  }, [selectedEventStatus, setValue]);

  async function onSubmit(values: EventFormValues) {
    setSubmitting(true);
    try {
      await addTrackingEvent(id, values);
      toast.success("Tracking event added");
      reset({ status: values.status, location: "", description: TRACKING_EVENT_DESCRIPTION_TEMPLATES[values.status], notes: "" });
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
        <div className="flex items-center gap-3">
          <Link
            href={`/platform/logistics-platform/shipments/${shipment.id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground"
          >
            <Pencil size={14} /> Edit shipment
          </Link>
          <StatusBadge status={shipment.status} carrierAware />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <RouteMapPlaceholder
            events={events}
            origin={{ city: shipment.sender.city, country: shipment.sender.country }}
            destination={{ city: shipment.receiver.city, country: shipment.receiver.country }}
          />
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
          {shipment.package.contentImageUrl && (
            <div className="col-span-2 border-t border-foreground/10 pt-4 sm:col-span-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">Package content image</p>
              <div className="relative h-56 w-full max-w-lg overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                <Image src={shipment.package.contentImageUrl} alt="Package contents" fill sizes="(max-width: 768px) 100vw, 512px" className="object-contain" unoptimized />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ShipmentEmailCard shipment={shipment} events={events} />

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
