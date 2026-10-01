import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.");
function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value); const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' || host === '169.254.169.254') return false;
    if (/^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)) return false;
    return true;
  } catch { return false; }
}
const remoteUrl = z.string().trim().url().max(2000).refine(isSafePublicUrl, "Use a safe public HTTP or HTTPS URL.");
const webUrl = z.union([z.literal(""), remoteUrl]);
const logoSource = z.union([
  z.literal(""),
  remoteUrl,
  z.string().max(450_000, "Compressed logo is too large.").regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Upload a PNG, JPEG, or WebP logo."),
]);

export const receiptTemplateInputSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(120),
  category: z.enum(["announcement", "order-update", "invitation", "banking", "support", "status-notice"]),
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
  warningEnabled: z.boolean().default(false),
  warningHeading: z.string().trim().max(160).default("Important notice"),
  warningMessage: z.string().trim().max(1200).default("Please review this information carefully before continuing."),
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
  senderIdentityId: z.string().trim().min(1).max(160),
});

export type ReceiptTemplateInput = z.infer<typeof receiptTemplateInputSchema>;
