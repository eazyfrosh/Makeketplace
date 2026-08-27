"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
import { ContactFields } from "@/components/logistics/contact-fields";
import { CarrierLogo } from "@/components/logistics/carrier-logo";
import { Button } from "@/components/logistics/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/logistics/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/logistics/ui/input";
import { ALL_CARRIERS } from "@/lib/logistics/data/carriers";
import { createShipment } from "@/lib/logistics/client";
import { shipmentSchema, type ShipmentFormInput, type ShipmentFormValues } from "@/lib/logistics/validation";
import { PACKAGE_TYPES, SERVICE_TYPES, SERVICE_LABELS } from "@/lib/logistics/types";

export function ShipmentForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ShipmentFormInput, unknown, ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      carrierCode: ALL_CARRIERS[0].code,
      serviceType: "standard",
      packageType: "box",
      insured: false,
      shippingCost: 0,
    },
  });

  const insured = watch("insured");
  const selectedCarrier = watch("carrierCode") || ALL_CARRIERS[0].code;

  async function onSubmit(values: ShipmentFormValues) {
    setSubmitting(true);
    try {
      const { shipment } = await createShipment(values);
      toast.success(`Shipment ${shipment.trackingNumber} created`);
      router.push(`/platform/logistics-platform/shipments/${shipment.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save shipment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-accent-500 text-white shadow-lg shadow-brand-500/25">
          <PackagePlus size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Create a shipment</h1>
          <p className="text-sm text-foreground/55">A tracking number will be generated automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Carrier &amp; service</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Carrier</Label>
              <div className="flex items-center gap-2">
                <CarrierLogo carrier={selectedCarrier} size={36} />
                <Select {...register("carrierCode")} className="flex-1">
                  {ALL_CARRIERS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <FieldError>{errors.carrierCode?.message}</FieldError>
            </div>
            <div>
              <Label>Service type</Label>
              <Select {...register("serviceType")}>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {SERVICE_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Reference number (optional)</Label>
              <Input {...register("referenceNumber")} placeholder="PO-10293" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sender information</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactFields prefix="sender" register={register} errors={errors} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receiver information</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactFields prefix="receiver" register={register} errors={errors} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.01" {...register("weightKg")} placeholder="2.5" />
              <FieldError>{errors.weightKg?.message}</FieldError>
            </div>
            <div>
              <Label>Length (cm)</Label>
              <Input type="number" step="0.1" {...register("lengthCm")} placeholder="30" />
              <FieldError>{errors.lengthCm?.message}</FieldError>
            </div>
            <div>
              <Label>Width (cm)</Label>
              <Input type="number" step="0.1" {...register("widthCm")} placeholder="20" />
              <FieldError>{errors.widthCm?.message}</FieldError>
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input type="number" step="0.1" {...register("heightCm")} placeholder="15" />
              <FieldError>{errors.heightCm?.message}</FieldError>
            </div>
            <div>
              <Label>Package type</Label>
              <Select {...register("packageType")}>
                {PACKAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-3">
              <Label>Package description (optional)</Label>
              <Input {...register("description")} placeholder="Electronics, documents, apparel…" />
            </div>
            <div className="sm:col-span-4">
              <Label>Special instructions (optional)</Label>
              <Textarea rows={3} {...register("specialInstructions")} placeholder="Leave at the front desk, signature required, etc." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery &amp; cost</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Estimated delivery date</Label>
              <Input type="date" {...register("estimatedDeliveryDate")} />
              <FieldError>{errors.estimatedDeliveryDate?.message}</FieldError>
            </div>
            <div>
              <Label>Shipping cost (USD)</Label>
              <Input type="number" step="0.01" {...register("shippingCost")} placeholder="45.00" />
              <FieldError>{errors.shippingCost?.message}</FieldError>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" className="h-4 w-4 rounded" {...register("insured")} />
                Insure this shipment
              </label>
              {insured && (
                <Input type="number" step="0.01" {...register("insuranceValue")} placeholder="Insured value (USD)" />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Create shipment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
