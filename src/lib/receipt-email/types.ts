export interface ReceiptEmailLineItem {
  description: string;
  quantity: number;
  unitAmountMinor: number;
}

export interface ReceiptEmailTemplate {
  id: string;
  userId: string;
  name: string;
  senderName: string;
  senderEmail: string;
  logoUrl: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone: string;
  merchantAddress: string;
  subject: string;
  message: string;
  footer: string;
  sampleCustomerName: string;
  sampleItems: ReceiptEmailLineItem[];
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type ReceiptEmailDeliveryStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "delivery_delayed"
  | "bounced"
  | "complained"
  | "failed"
  | "suppressed";

export interface ReceiptEmailSend {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
  recipientEmail: string;
  customerName: string;
  merchantName: string;
  transactionId: string;
  transactionType: string;
  transactionReference: string;
  amountMinor: number;
  currency: string;
  provider: "resend";
  providerEmailId: string | null;
  status: ReceiptEmailDeliveryStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptTransactionOption {
  id: string;
  type: "order" | "wallet" | "subscription" | "domain";
  reference: string;
  description: string;
  amountMinor: number;
  currency: string;
  occurredAt: string;
  lineItems: ReceiptEmailLineItem[];
}
