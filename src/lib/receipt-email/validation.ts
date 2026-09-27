import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.");
const lineItem = z.object({
  description: z.string().trim().min(1).max(160),
  quantity: z.number().int().min(1).max(10_000),
  unitAmountMinor: z.number().int().min(0).max(1_000_000_000),
});

export const receiptTemplateInputSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(120),
  senderName: z.string().trim().min(1).max(120),
  senderEmail: z.string().trim().toLowerCase().email().max(254),
  logoUrl: z.union([
    z.literal(""),
    z.string().trim().url().max(2000).refine((value) => /^https?:\/\//i.test(value), "Logo URL must use HTTP or HTTPS."),
  ]),
  primaryColor: color,
  backgroundColor: color,
  textColor: color,
  merchantName: z.string().trim().min(1).max(160),
  merchantEmail: z.string().trim().toLowerCase().email().max(254),
  merchantPhone: z.string().trim().max(50),
  merchantAddress: z.string().trim().max(400),
  subject: z.string().trim().min(1).max(180),
  message: z.string().trim().max(2000),
  footer: z.string().trim().max(1000),
  sampleCustomerName: z.string().trim().max(160),
  sampleItems: z.array(lineItem).min(1).max(25),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
});

export const receiptSendInputSchema = z.object({
  requestId: z.string().uuid(),
  templateId: z.string().trim().min(1).max(120),
  transactionId: z.string().trim().min(1).max(200),
  recipientEmail: z.string().trim().toLowerCase().email().max(254),
  customerName: z.string().trim().min(1).max(160),
});

export type ReceiptTemplateInput = z.infer<typeof receiptTemplateInputSchema>;
