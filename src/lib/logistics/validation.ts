import { z } from "zod";
import { PACKAGE_TYPES, SERVICE_TYPES } from "@/lib/logistics/types";

const contactSchema = z.object({
  name: z.string().min(2, "Required"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(5, "Required"),
  address: z.string().min(3, "Required"),
  city: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  postalCode: z.string().min(1, "Required"),
});

export const shipmentSchema = z.object({
  carrierCode: z.string().min(1, "Select a carrier"),
  serviceType: z.enum(SERVICE_TYPES),
  referenceNumber: z.string().optional(),
  sender: contactSchema,
  receiver: contactSchema,
  weightKg: z.coerce.number().positive("Must be greater than 0"),
  lengthCm: z.coerce.number().positive("Must be greater than 0"),
  widthCm: z.coerce.number().positive("Must be greater than 0"),
  heightCm: z.coerce.number().positive("Must be greater than 0"),
  packageType: z.enum(PACKAGE_TYPES),
  description: z.string().optional(),
  specialInstructions: z.string().optional(),
  estimatedDeliveryDate: z.string().min(1, "Required"),
  shippingCost: z.coerce.number().min(0, "Must be 0 or greater"),
  insured: z.boolean(),
  insuranceValue: z.coerce.number().optional(),
});
export type ShipmentFormInput = z.input<typeof shipmentSchema>;
export type ShipmentFormValues = z.output<typeof shipmentSchema>;
