import type { DnsRecord } from "@/types/domains";

export type EmailDomainStatus = "setting_up" | "verifying" | "ready" | "failed";
export type DeliveryStatus = "queued" | "sent" | "delivered" | "delayed" | "bounced" | "failed" | "complained";

export interface EmailDomainRecord {
  id: string;
  userId: string;
  domainId: string;
  domain: string;
  provider: "resend";
  providerDomainId: string | null;
  status: EmailDomainStatus;
  dnsRecords: DnsRecord[];
  dnsConfiguredAt: string | null;
  verifiedAt: string | null;
  suspended: boolean;
  suspensionReason: string | null;
  sentCount: number;
  deliveredCount: number;
  bouncedCount: number;
  complaintCount: number;
  lastError: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SenderIdentity {
  id: string;
  userId: string;
  domainId: string;
  emailDomainId: string;
  domain: string;
  localPart: string;
  address: string;
  displayName: string;
  replyTo: string;
  isDefault: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailProviderDnsRecord extends DnsRecord { purpose: "spf" | "dkim" | "dmarc" | "return_path" | "verification"; }

export interface EmailProviderDomain {
  providerDomainId: string;
  domain: string;
  status: "pending" | "verified" | "failed";
  records: EmailProviderDnsRecord[];
}
