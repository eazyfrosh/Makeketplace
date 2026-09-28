import "server-only";

import { Resend } from "resend";
import type { EmailProviderDomain, EmailProviderDnsRecord } from "@/lib/email-domains/types";

export class EmailDomainProviderError extends Error {
  constructor(public readonly code: "EMAIL_PROVIDER_NOT_CONFIGURED" | "EMAIL_PROVIDER_REJECTED", message: string) { super(message); this.name = "EmailDomainProviderError"; }
}

export interface EmailDomainProvider {
  readonly name: string;
  isConfigured(): boolean;
  addDomain(domain: string, idempotencyKey: string): Promise<EmailProviderDomain>;
  getVerificationRecords(providerDomainId: string): Promise<EmailProviderDnsRecord[]>;
  getVerificationStatus(providerDomainId: string): Promise<EmailProviderDomain>;
  sendEmail(input: { from: string; fromName: string; replyTo: string; to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<{ messageId: string }>;
  verifyWebhook(payload: string, headers: Headers): Promise<unknown>;
}

type ResendRecord = { record?: string; name?: string; type?: string; value?: string; ttl?: string | number; priority?: number; status?: string };
type ResendDomain = { id?: string; name?: string; status?: string; records?: ResendRecord[] };

function mapPurpose(record: ResendRecord): EmailProviderDnsRecord["purpose"] {
  const haystack = `${record.record ?? ""} ${record.name ?? ""} ${record.value ?? ""}`.toLowerCase();
  if (haystack.includes("dkim")) return "dkim";
  if (haystack.includes("dmarc")) return "dmarc";
  if (record.type === "MX" || haystack.includes("feedback-smtp") || haystack.includes("return")) return "return_path";
  if (haystack.includes("spf")) return "spf";
  return "verification";
}

function mapRecords(records: ResendRecord[] = []): EmailProviderDnsRecord[] {
  return records.filter((record) => record.name && record.type && record.value).map((record) => ({ host: String(record.name), type: String(record.type).toUpperCase() as EmailProviderDnsRecord["type"], value: String(record.value), ttl: Number(record.ttl ?? 3600), priority: record.priority, purpose: mapPurpose(record) }));
}

export class ResendEmailDomainProvider implements EmailDomainProvider {
  readonly name = "resend";
  private readonly client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  isConfigured() { return Boolean(this.client && process.env.RESEND_WEBHOOK_SECRET); }
  private requireClient() { if (!this.client) throw new EmailDomainProviderError("EMAIL_PROVIDER_NOT_CONFIGURED", "Email-domain provisioning is not configured."); return this.client; }
  async addDomain(domain: string, _idempotencyKey: string): Promise<EmailProviderDomain> { void _idempotencyKey; const result = await this.requireClient().domains.create({ name: domain, customReturnPath: "eazytool" }); if (result.error || !result.data?.id) throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", result.error?.message ?? "The email provider rejected the domain."); const data = result.data as ResendDomain; return { providerDomainId: String(data.id), domain, status: data.status === "verified" ? "verified" : "pending", records: mapRecords(data.records) }; }
  async getVerificationRecords(providerDomainId: string) { return (await this.getVerificationStatus(providerDomainId)).records; }
  async getVerificationStatus(providerDomainId: string): Promise<EmailProviderDomain> { const result = await this.requireClient().domains.get(providerDomainId); if (result.error || !result.data) throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", result.error?.message ?? "Email-domain status is unavailable."); const data = result.data as ResendDomain; return { providerDomainId, domain: String(data.name ?? ""), status: data.status === "verified" ? "verified" : data.status === "failed" ? "failed" : "pending", records: mapRecords(data.records) }; }
  async sendEmail(input: { from: string; fromName: string; replyTo: string; to: string; subject: string; html: string; text: string; idempotencyKey: string }) { const result = await this.requireClient().emails.send({ from: `${input.fromName.replace(/[<>\r\n]/g, "")} <${input.from}>`, replyTo: input.replyTo, to: input.to, subject: input.subject, html: input.html, text: input.text }, { idempotencyKey: input.idempotencyKey }); if (result.error || !result.data?.id) throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", result.error?.message ?? "The email provider rejected this message."); return { messageId: result.data.id }; }
  async verifyWebhook(payload: string, headers: Headers) { const client = this.requireClient(); const secret = process.env.RESEND_WEBHOOK_SECRET; if (!secret) throw new EmailDomainProviderError("EMAIL_PROVIDER_NOT_CONFIGURED", "Email webhooks are not configured."); return client.webhooks.verify({ payload, webhookSecret: secret, headers: { id: headers.get("svix-id") ?? "", timestamp: headers.get("svix-timestamp") ?? "", signature: headers.get("svix-signature") ?? "" } }); }
}

export const emailDomainProvider = new ResendEmailDomainProvider();
