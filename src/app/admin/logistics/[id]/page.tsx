"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageCircle, PlusCircle, Save, Send } from "lucide-react";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import {
  addTrackingEvent,
  getAdminShipmentDetail,
  getShipmentMessages,
  sendShipmentMessage,
  updateAdminShipment,
} from "@/lib/logistics/client";
import { ALL_CARRIERS, getCarrier } from "@/lib/logistics/data/carriers";
import {
  PACKAGE_TYPES,
  SERVICE_LABELS,
  SERVICE_TYPES,
  SHIPMENT_STATUSES,
  STATUS_LABELS,
} from "@/lib/logistics/types";
import { formatDateTime } from "@/lib/logistics/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContactInfo, PackageInfo, Shipment, ShipmentMessage, ShipmentStatus, TrackingEvent } from "@/lib/logistics/types";

interface EditableShipment {
  carrierCode: string;
  serviceType: Shipment["serviceType"];
  referenceNumber: string;
  sender: ContactInfo;
  receiver: ContactInfo;
  package: PackageInfo;
  specialInstructions: string;
  estimatedDeliveryDate: string;
  shippingCost: string;
  insured: boolean;
  insuranceValue: string;
}

function toEditable(shipment: Shipment): EditableShipment {
  return {
    carrierCode: shipment.carrierCode,
    serviceType: shipment.serviceType,
    referenceNumber: shipment.referenceNumber ?? "",
    sender: shipment.sender,
    receiver: shipment.receiver,
    package: shipment.package,
    specialInstructions: shipment.specialInstructions ?? "",
    estimatedDeliveryDate: shipment.estimatedDeliveryDate.slice(0, 10),
    shippingCost: String(shipment.shippingCost),
    insured: shipment.insured,
    insuranceValue: shipment.insuranceValue != null ? String(shipment.insuranceValue) : "",
  };
}

function ContactEditFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ContactInfo;
  onChange: (next: ContactInfo) => void;
}) {
  function set<K extends keyof ContactInfo>(key: K, v: ContactInfo[K]) {
    onChange({ ...value, [key]: v });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={value.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={value.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label>Postal code</Label>
          <Input value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Input value={value.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <Label>City</Label>
          <Input value={value.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={value.country} onChange={(e) => set("country", e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}

interface EventFormValues {
  status: ShipmentStatus;
  location: string;
  description: string;
  notes?: string;
}

const MESSAGE_POLL_MS = 4000;

function AdminShipmentChat({ shipmentId }: { shipmentId: string }) {
  const [messages, setMessages] = React.useState<ShipmentMessage[]>([]);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  React.useEffect(() => {
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
      toast.error(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="size-4" /> Live chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Messages from the customer about this shipment will show up here.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex", m.senderRole === "admin" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    m.senderRole === "admin" ? "bg-brand-600 text-white" : "bg-white/10 text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn("mt-1 text-[10px]", m.senderRole === "admin" ? "text-white/60" : "text-muted-foreground")}>
                    {formatDateTime(m.createdAt)}
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
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply to customer…" />
          <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Send reply">
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminLogisticsShipmentPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [shipment, setShipment] = React.useState<Shipment | null>(null);
  const [events, setEvents] = React.useState<TrackingEvent[]>([]);
  const [edit, setEdit] = React.useState<EditableShipment | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [addingEvent, setAddingEvent] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminShipmentDetail(id);
      setShipment(data.shipment);
      setEvents(data.events);
      setEdit(toEditable(data.shipment));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load this shipment.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  const { register: registerEvent, handleSubmit: handleEventSubmit, reset: resetEventForm } = useForm<EventFormValues>({
    defaultValues: { status: "pending", location: "", description: "" },
  });

  async function onAddEvent(values: EventFormValues) {
    setAddingEvent(true);
    try {
      await addTrackingEvent(id, values);
      toast.success("Tracking event added.");
      resetEventForm({ status: values.status, location: "", description: "", notes: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add tracking event.");
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleSaveDetails() {
    if (!edit) return;
    const shippingCost = Number(edit.shippingCost);
    if (!(shippingCost >= 0)) {
      toast.error("Shipping cost must be 0 or greater.");
      return;
    }
    const insuranceValue = edit.insured && edit.insuranceValue.trim() ? Number(edit.insuranceValue) : undefined;
    setSaving(true);
    try {
      const { shipment: updated } = await updateAdminShipment(id, {
        carrierCode: edit.carrierCode,
        serviceType: edit.serviceType,
        referenceNumber: edit.referenceNumber.trim() || undefined,
        sender: edit.sender,
        receiver: edit.receiver,
        package: edit.package,
        specialInstructions: edit.specialInstructions.trim() || undefined,
        estimatedDeliveryDate: edit.estimatedDeliveryDate,
        shippingCost,
        insured: edit.insured,
        insuranceValue,
      });
      setShipment(updated);
      setEdit(toEditable(updated));
      toast.success("Shipment updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update shipment.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/admin/logistics" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-3.5" /> Back to shipments
      </Link>

      {loading ? (
        <div className="mt-12 flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error || !shipment || !edit ? (
        <EmptyState className="mt-12" title="Couldn't load this shipment" description={error ?? "Unknown error."} />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-mono text-2xl font-semibold tracking-tight">{shipment.trackingNumber}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {getCarrier(shipment.carrierCode).name} · {shipment.shipmentNumber}
              </p>
            </div>
            <Badge variant={shipment.status === "delivered" ? "default" : "outline"} className="capitalize">
              {STATUS_LABELS[shipment.status]}
            </Badge>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Shipment details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Carrier</Label>
                <Select value={edit.carrierCode} onValueChange={(v) => setEdit({ ...edit, carrierCode: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CARRIERS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service type</Label>
                <Select
                  value={edit.serviceType}
                  onValueChange={(v) => setEdit({ ...edit, serviceType: v as Shipment["serviceType"] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SERVICE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference number</Label>
                <Input
                  value={edit.referenceNumber}
                  onChange={(e) => setEdit({ ...edit, referenceNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Estimated delivery date</Label>
                <Input
                  type="date"
                  value={edit.estimatedDeliveryDate}
                  onChange={(e) => setEdit({ ...edit, estimatedDeliveryDate: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Special instructions</Label>
                <Textarea
                  rows={2}
                  value={edit.specialInstructions}
                  onChange={(e) => setEdit({ ...edit, specialInstructions: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ContactEditFields label="Sender" value={edit.sender} onChange={(v) => setEdit({ ...edit, sender: v })} />
            <ContactEditFields label="Receiver" value={edit.receiver} onChange={(v) => setEdit({ ...edit, receiver: v })} />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Package &amp; cost</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={edit.package.weightKg}
                  onChange={(e) => setEdit({ ...edit, package: { ...edit.package, weightKg: Number(e.target.value) } })}
                />
              </div>
              <div>
                <Label>Length (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={edit.package.lengthCm}
                  onChange={(e) => setEdit({ ...edit, package: { ...edit.package, lengthCm: Number(e.target.value) } })}
                />
              </div>
              <div>
                <Label>Width (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={edit.package.widthCm}
                  onChange={(e) => setEdit({ ...edit, package: { ...edit.package, widthCm: Number(e.target.value) } })}
                />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={edit.package.heightCm}
                  onChange={(e) => setEdit({ ...edit, package: { ...edit.package, heightCm: Number(e.target.value) } })}
                />
              </div>
              <div>
                <Label>Package type</Label>
                <Select
                  value={edit.package.packageType}
                  onValueChange={(v) =>
                    setEdit({ ...edit, package: { ...edit.package, packageType: v as PackageInfo["packageType"] } })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGE_TYPES.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shipping cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={edit.shippingCost}
                  onChange={(e) => setEdit({ ...edit, shippingCost: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Checkbox
                  checked={edit.insured}
                  onCheckedChange={(checked) => setEdit({ ...edit, insured: checked === true })}
                />
                <Label>Insured</Label>
              </div>
              {edit.insured && (
                <div>
                  <Label>Insurance value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={edit.insuranceValue}
                    onChange={(e) => setEdit({ ...edit, insuranceValue: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-end">
            <Button disabled={saving} onClick={handleSaveDetails}>
              <Save className="size-4" /> {saving ? "Saving…" : "Save shipment details"}
            </Button>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold">Tracking history</h2>
            {events.length === 0 ? (
              <EmptyState className="mt-4" title="No tracking events yet" description="Add the first event below." />
            ) : (
              <div className="mt-4 space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="capitalize">
                        {STATUS_LABELS[ev.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(ev.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm">{ev.description}</p>
                    <p className="text-xs text-muted-foreground">{ev.location}</p>
                    {ev.notes && <p className="mt-1 text-xs text-muted-foreground">{ev.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Add a tracking event</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEventSubmit(onAddEvent)} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <select
                    {...registerEvent("status")}
                    className="border-input h-11 w-full rounded-xl border bg-transparent px-4 py-2 text-sm outline-none"
                  >
                    {SHIPMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input {...registerEvent("location", { required: true })} placeholder="Memphis, TN sorting hub" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Input {...registerEvent("description", { required: true })} placeholder="Package arrived at sorting facility" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes (optional)</Label>
                  <Textarea rows={2} {...registerEvent("notes")} />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={addingEvent}>
                    <PlusCircle className="size-4" /> {addingEvent ? "Adding…" : "Add event"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <AdminShipmentChat shipmentId={shipment.id} />
        </>
      )}
    </div>
  );
}
