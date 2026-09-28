export type EmailDesignCategory = "announcement" | "order-update" | "invitation" | "support" | "status-notice";

export interface ReceiptEmailTemplate {
  id: string;
  userId: string;
  schemaVersion: 2;
  name: string;
  category: EmailDesignCategory;
  senderName: string;
  senderEmail: string;
  brandName: string;
  logoUrl: string;
  subject: string;
  statusLabel: string;
  heading: string;
  paragraphs: string[];
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  panelColor: string;
  panelTextColor: string;
  featuredImageUrl: string;
  panelHeading: string;
  panelBody: string;
  warningEnabled: boolean;
  warningHeading: string;
  warningMessage: string;
  buttonEnabled: boolean;
  buttonText: string;
  buttonUrl: string;
  footer: string;
  createdAt: string;
  updatedAt: string;
}

export type ReceiptEmailDeliveryStatus = "sending" | "sent" | "delivered" | "delivery_delayed" | "bounced" | "complained" | "failed" | "suppressed";

export interface ReceiptEmailSend {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
  category: EmailDesignCategory;
  recipientEmail: string;
  brandName: string;
  senderEmail: string;
  subject: string;
  sendMode: "test" | "delivery";
  recipientConsentConfirmed: boolean;
  provider: "resend";
  providerEmailId: string | null;
  status: ReceiptEmailDeliveryStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
