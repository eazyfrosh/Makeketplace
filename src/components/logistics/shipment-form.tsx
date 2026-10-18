"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, MessageCircle, PackagePlus, X } from "lucide-react";
import { ContactFields } from "@/components/logistics/contact-fields";
import { CarrierLogo } from "@/components/logistics/carrier-logo";
import { Button } from "@/components/logistics/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/logistics/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/logistics/ui/input";
import { ALL_CARRIERS } from "@/lib/logistics/data/carriers";
import { createShipment, updateShipment, uploadShipmentContentImage } from "@/lib/logistics/client";
import { shipmentSchema, type ShipmentFormInput, type ShipmentFormValues } from "@/lib/logistics/validation";
import { PACKAGE_TYPES, SERVICE_TYPES, SERVICE_LABELS } from "@/lib/logistics/types";

interface ShipmentFormProps {
  /** Editing an existing shipment instead of creating a new one. */
  shipmentId?: string;
  defaultValues?: Partial<ShipmentFormInput>;
}

export function ShipmentForm({ shipmentId, defaultValues }: ShipmentFormProps) {
  const router = useRouter();
  const isEdit = Boolean(shipmentId);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShipmentFormInput, unknown, ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      carrierCode: ALL_CARRIERS[0].code,
      serviceType: "standard",
      packageType: "box",
      insured: false,
      shippingCost: 0,
      ...defaultValues,
    },
  });

  const insured = watch("insured");
  const selectedCarrier = watch("carrierCode") || ALL_CARRIERS[0].code;
  const contentImageUrl = watch("contentImageUrl");

  async function handleContentImage(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("The package image must be 5 MB or smaller.");
      return;
    }

    setUploadingImage(true);
    try {
      const { url } = await uploadShipmentContentImage(file);
      setValue("contentImageUrl", url, { shouldDirty: true, shouldValidate: true });
      toast.success("Package image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The package image could not be uploaded.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(values: ShipmentFormValues) {
    setSubmitting(true);
    try {
      if (isEdit && shipmentId) {
        await updateShipment(shipmentId, values);
        toast.success("Shipment updated");
        router.push(`/platform/logistics-platform/shipments/${shipmentId}`);
      } else {
        const { shipment } = await createShipment(values);
        toast.success(`Shipment ${shipment.trackingNumber} created`);
        router.push(`/platform/logistics-platform/shipments/${shipment.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save shipment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-accent-500 text-white shadow-lg shadow-brand-500/25">
            <PackagePlus size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? "Edit shipment" : "Create a shipment"}</h1>
            <p className="text-sm text-foreground/55">
              {isEdit
                ? "Tracking number and status stay the same — update the shipment's own details below."
                : "A tracking number will be generated automatically."}
            </p>
          </div>
        </div>
        <Link href="/platform/logistics-platform/chat-widgets" className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"><MessageCircle className="size-4" />WhatsApp &amp; chat settings</Link>
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
              <Label>Package content image (optional)</Label>
              <input type="hidden" {...register("contentImageUrl")} />
              <div className="mt-1.5 rounded-2xl border border-dashed border-foreground/20 p-4">
                {contentImageUrl ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-40 w-full overflow-hidden rounded-xl bg-black/5 sm:h-28 sm:w-40 dark:bg-white/5">
                      <Image src={contentImageUrl} alt="Uploaded package contents" fill sizes="(max-width: 640px) 100vw, 160px" className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Package image ready</p>
                      <p className="mt-1 text-xs leading-5 text-foreground/50">This image will be saved with the shipment details and will not be published on the public TrackNova tracking page.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-foreground/15 px-3 py-2 text-xs font-semibold hover:bg-foreground/5">
                          <ImagePlus size={14} /> Replace image
                          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleContentImage(file); event.currentTarget.value = ""; }} />
                        </label>
                        <button type="button" onClick={() => setValue("contentImageUrl", undefined, { shouldDirty: true, shouldValidate: true })} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10">
                          <X size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl bg-foreground/[0.025] px-5 py-6 text-center hover:bg-foreground/[0.05]">
                    {uploadingImage ? <Loader2 className="size-7 animate-spin text-[var(--carrier-primary)]" /> : <ImagePlus className="size-7 text-[var(--carrier-primary)]" />}
                    <span className="mt-3 text-sm font-semibold">{uploadingImage ? "Uploading image…" : "Upload a photo of the package contents"}</span>
                    <span className="mt-1 text-xs text-foreground/50">JPG, PNG or WebP · Maximum 5 MB</span>
                    <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleContentImage(file); event.currentTarget.value = ""; }} />
                  </label>
                )}
              </div>
              <FieldError>{errors.contentImageUrl?.message}</FieldError>
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
          <Button type="submit" size="lg" disabled={submitting || uploadingImage}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create shipment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
