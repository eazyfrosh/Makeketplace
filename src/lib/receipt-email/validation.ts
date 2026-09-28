import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.");
const remoteUrl = z.string().trim().url().max(2000).refine((value) => /^https?:\/\//i.test(value), "URL must use HTTP or HTTPS.");
const webUrl = z.union([z.literal(""), remoteUrl]);
const logoSource = z.union([
  z.literal(""),
  remoteUrl,
  z.string().max(450_000, "Compressed logo is too large.").regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Upload a PNG, JPEG, or WebP logo."),
]);

export const receiptTemplateInputSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(120),
  category: z.enum(["announcement", "order-update", "invitation", "support", "status-notice"]),
  senderName: z.string().trim().min(1).max(120),
  senderEmail: z.string().trim().toLowerCase().email().max(254),
  brandName: z.string().trim().min(1).max(160),
  logoUrl: logoSource,
  subject: z.string().trim().min(1).max(180),
  statusLabel: z.string().trim().max(80),
  heading: z.string().trim().min(1).max(240),
  paragraphs: z.array(z.string().trim().min(1).max(2000)).min(1).max(8),
  backgroundColor: color,
  cardColor: color,
  textColor: color,
  mutedColor: color,
  accentColor: color,
  panelColor: color,
  panelTextColor: color,
  featuredImageUrl: webUrl,
  panelHeading: z.string().trim().max(180),
  panelBody: z.string().trim().max(1200),
  buttonEnabled: z.boolean(),
  buttonText: z.string().trim().max(80),
  buttonUrl: webUrl,
  footer: z.string().trim().max(1200),
});

export const receiptSendInputSchema = z.object({
  requestId: z.string().uuid(),
  templateId: z.string().trim().min(1).max(120),
  mode: z.enum(["test", "delivery"]),
  recipientEmail: z.string().trim().toLowerCase().email().max(254).optional(),
  recipientConsentConfirmed: z.boolean().default(false),
});

export type ReceiptTemplateInput = z.infer<typeof receiptTemplateInputSchema>;
