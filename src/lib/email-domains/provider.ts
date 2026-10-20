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
  verifyDomain(providerDomainId: string): Promise<void>;
  getVerificationStatus(providerDomainId: string): Promise<EmailProviderDomain>;
  sendEmail(input: { from: string; fromName: string; replyTo: string; to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<{ messageId: string }>;
  verifyWebhook(payload: string, headers: Headers): Promise<unknown>;
}

type ResendRecord = { record?: string; name?: string; type?: string; value?: string; ttl?: string | number; priority?: number; status?: string };
type ResendDomain = { id?: string; name?: string; status?: string; records?: ResendRecord[] };

function mapDomainStatus(status: string | undefined): EmailProviderDomain["status"] {
  if (status === "verified" || status === "failed" || status === "not_started") return status;
  return "pending";
}

function mapPurpose(record: ResendRecord): EmailProviderDnsRecord["purpose"] {
  const haystack = `${record.record ?? ""} ${record.name ?? ""} ${record.value ?? ""}`.toLowerCase();
  if (haystack.includes("dkim")) return "dkim";
  if (haystack.includes("dmarc")) return "dmarc";
  if (record.type === "MX" || haystack.includes("feedback-smtp") || haystack.includes("return")) return "return_path";
  if (haystack.includes("spf")) return "spf";
  return "verification";
}

function mapRecords(records: ResendRecord[] = []): EmailProviderDnsRecord[] {
  return records.filter((record) => record.name && record.type && record.value).map((record) => {
    const mapped: EmailProviderDnsRecord = {
      host: String(record.name),
      type: String(record.type).toUpperCase() as EmailProviderDnsRecord["type"],
      value: String(record.value),
      ttl: Number(record.ttl ?? 3600),
      purpose: mapPurpose(record),
    };

    // Firestore rejects explicit `undefined` values. Resend only supplies a
    // priority for records that need one (typically MX), so omit the optional
    // property entirely for all other DNS records.
    if (Number.isFinite(record.priority)) mapped.priority = record.priority;

    return mapped;
  });
}

export class ResendEmailDomainProvider implements EmailDomainProvider {
  readonly name = "resend";
  private readonly client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  // Domain provisioning and sending only require the Resend API key. The
  // webhook secret is validated separately when delivery events arrive.
  isConfigured() { return Boolean(this.client); }
  private requireClient() { if (!this.client) throw new EmailDomainProviderError("EMAIL_PROVIDER_NOT_CONFIGURED", "Email-domain provisioning is not configured."); return this.client; }
  private async findDomain(domain: string): Promise<EmailProviderDomain | null> {
    const client = this.requireClient();
    const normalized = domain.trim().toLowerCase();
    let after: string | undefined;

    while (true) {
      const listed = await client.domains.list(after ? { limit: 100, after } : { limit: 100 });
      if (listed.error || !listed.data) throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", listed.error?.message ?? "Existing email domains could not be checked.");
      const match = listed.data.data.find((item) => item.name.trim().toLowerCase() === normalized);
      if (match) return this.getVerificationStatus(match.id);
      const last = listed.data.data.at(-1);
      if (!listed.data.has_more || !last) return null;
      after = last.id;
    }
  }
  async addDomain(domain: string, _idempotencyKey: string): Promise<EmailProviderDomain> {
    void _idempotencyKey;
    const existing = await this.findDomain(domain);
    if (existing) return existing;

    const result = await this.requireClient().domains.create({ name: domain, customReturnPath: "eazytool" });
    if (result.error || !result.data?.id) {
      // A previous or concurrent attempt may have created the Resend domain
      // before EazyTool persisted its provider ID. Reconcile it instead of
      // treating the harmless duplicate as a terminal setup failure.
      const recovered = await this.findDomain(domain);
      if (recovered) return recovered;
      throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", result.error?.message ?? "The email provider rejected the domain.");
    }
    const data = result.data as ResendDomain;
    return { providerDomainId: String(data.id), domain, status: mapDomainStatus(data.status), records: mapRecords(data.records) };
  }
  async getVerificationRecords(providerDomainId: string) { return (await this.getVerificationStatus(providerDomainId)).records; }
  async verifyDomain(providerDomainId: string): Promise<void> { const result = await this.requireClient().domains.verify(providerDomainId); if (result.error || !result.data) throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", "The email provider could not start domain verification. Please try again later."); }
  async getVerificationStatus(providerDomainId: string): Promise<EmailProviderDomain> { const result = await this.requireClient().domains.get(providerDomainId); if (result.error || !result.data) throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", result.error?.message ?? "Email-domain status is unavailable."); const data = result.data as ResendDomain; return { providerDomainId, domain: String(data.name ?? ""), status: mapDomainStatus(data.status), records: mapRecords(data.records) }; }
  async sendEmail(input: { from: string; fromName: string; replyTo: string; to: string; subject: string; html: string; text: string; idempotencyKey: string }) { const result = await this.requireClient().emails.send({ from: `${input.fromName.replace(/[<>\r\n]/g, "")} <${input.from}>`, replyTo: input.replyTo, to: input.to, subject: input.subject, html: input.html, text: input.text }, { idempotencyKey: input.idempotencyKey }); if (result.error || !result.data?.id) throw new EmailDomainProviderError("EMAIL_PROVIDER_REJECTED", result.error?.message ?? "The email provider rejected this message."); return { messageId: result.data.id }; }
  async verifyWebhook(payload: string, headers: Headers) { const client = this.requireClient(); const secret = process.env.RESEND_WEBHOOK_SECRET; if (!secret) throw new EmailDomainProviderError("EMAIL_PROVIDER_NOT_CONFIGURED", "Email webhooks are not configured."); return client.webhooks.verify({ payload, webhookSecret: secret, headers: { id: headers.get("svix-id") ?? "", timestamp: headers.get("svix-timestamp") ?? "", signature: headers.get("svix-signature") ?? "" } }); }
}

export const emailDomainProvider = new ResendEmailDomainProvider();
