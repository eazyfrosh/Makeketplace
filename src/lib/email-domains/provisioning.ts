import "server-only";

import { randomUUID } from "node:crypto";
import { emailDomainProvider } from "@/lib/email-domains/provider";
import { claimEmailDomainVerification, ensureDefaultSenderIdentity, getEmailDomainByDomainId, saveEmailDomain } from "@/lib/email-domains/store";
import type { EmailDomainRecord, EmailProviderDnsRecord, EmailProviderDomain } from "@/lib/email-domains/types";
import { getDomainProvider } from "@/lib/domains/registry";
import { DomainProviderError, requireDomainProvider } from "@/lib/domains/provider";
import { dnsRecordsMatch } from "@/lib/domains/dns-records";
import { EMAIL_DOMAIN_VERIFICATION_RETRY_DELAY_MS, shouldRequestEmailDomainVerification } from "@/lib/email-domains/verification-decision";
import type { DomainRecord } from "@/types/domains";
import { getDomain, saveDomain } from "@/lib/domains/store";

function ensureDmarc(records: EmailProviderDnsRecord[], domain: string): EmailProviderDnsRecord[] {
  if (records.some((record) => record.purpose === "dmarc")) return records;
  return [...records, { host: `_dmarc.${domain}`, type: "TXT", value: "v=DMARC1; p=none; adkim=s; aspf=s", ttl: 3600, purpose: "dmarc" }];
}

async function ensureDefaultSender(record: EmailDomainRecord, domain: DomainRecord) {
  const replyTo = domain.registrant?.email?.trim().toLowerCase();
  if (!replyTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) return;
  await ensureDefaultSenderIdentity(record, { displayName: domain.registrant?.organization || domain.registrant?.name || domain.domain, replyTo });
}

const confirmedRegistrationStatuses = new Set([
  "registered",
  "dns_pending",
  "email_verification_pending",
  "email_ready",
]);

async function startVerificationIfNeeded(record: EmailDomainRecord, status: EmailProviderDomain, allowRetry: boolean) {
  if (!shouldRequestEmailDomainVerification(record, status.status, allowRetry)) return status;
  const retry = allowRetry && (status.status === "failed" || status.status === "not_started");
  const claimedAt = await claimEmailDomainVerification(record.id, record.verificationRequestedAt ?? null, retry);
  if (!claimedAt) return status;
  // Resend verification is asynchronous. Never call it again on ordinary
  // status checks: a repeat request resets its status to pending.
  await emailDomainProvider.verifyDomain(status.providerDomainId);
  record.verificationRequestedAt = claimedAt;
  return { ...status, status: "pending" as const };
}

export async function provisionEmailDomain(domain: DomainRecord) {
  // Older records stored email-provisioning progress in registrationStatus.
  // Accept those records here, then normalize them back to `registered` below.
  if (domain.status !== "active" || !confirmedRegistrationStatuses.has(domain.registrationStatus ?? "") || !domain.providerDomainId) throw new Error("DOMAIN_NOT_REGISTERED");
  if (!emailDomainProvider.isConfigured()) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  const registrar = requireDomainProvider(getDomainProvider(domain.registrar));
  const existing = await getEmailDomainByDomainId(domain.id);
  const now = new Date().toISOString();
  let record: EmailDomainRecord = existing ?? { id: `email_domain_${randomUUID()}`, userId: domain.userId, domainId: domain.id, domain: domain.domain, provider: "resend", providerDomainId: null, status: "setting_up", dnsRecords: [], dnsConfiguredAt: null, verificationRequestedAt: null, verifiedAt: null, suspended: false, suspensionReason: null, sentCount: 0, deliveredCount: 0, bouncedCount: 0, complaintCount: 0, lastError: null, lastCheckedAt: null, createdAt: now, updatedAt: now };
  await saveEmailDomain(record);
  try {
    if (!record.providerDomainId) {
      const added = await emailDomainProvider.addDomain(domain.domain, record.id);
      record = { ...record, providerDomainId: added.providerDomainId, dnsRecords: ensureDmarc(added.records, domain.domain), status: added.status === "verified" ? "ready" : "setting_up", updatedAt: new Date().toISOString() };
      await saveEmailDomain(record);
    }
    const providerDomainId = record.providerDomainId;
    if (!providerDomainId) throw new Error("EMAIL_PROVIDER_DOMAIN_MISSING");
    const providerRecords = ensureDmarc(await emailDomainProvider.getVerificationRecords(providerDomainId), domain.domain);
    const existingDns = await registrar.getDnsStatus(domain.providerDomainId);
    for (const dnsRecord of providerRecords) if (!existingDns.some((current) => dnsRecordsMatch(current, dnsRecord, domain.domain))) await registrar.createDnsRecord(domain.providerDomainId, dnsRecord);
    record = { ...record, dnsRecords: providerRecords, dnsConfiguredAt: new Date().toISOString() };
    const status = await startVerificationIfNeeded(record, await emailDomainProvider.getVerificationStatus(providerDomainId), true);
    record = { ...record, status: status.status === "verified" ? "ready" : "verifying", verifiedAt: status.status === "verified" ? new Date().toISOString() : record.verifiedAt, lastError: null, lastCheckedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await saveEmailDomain(record);
    await saveDomain({ ...domain, registrationStatus: "registered", dnsStatus: "configured", emailVerificationStatus: record.status === "ready" ? "verified" : "pending", updatedAt: new Date().toISOString() });
    if (record.status === "ready") await ensureDefaultSender(record, domain);
    return record;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email-domain provisioning failed.";
    if (error instanceof DomainProviderError && error.code === "UNSUPPORTED_OPERATION") {
      const pendingMessage = "Automatic DNS setup is waiting for Domain Name API DNS record access. Your domain is registered and no DNS update has been reported as complete.";
      record = { ...record, status: "setting_up", dnsConfiguredAt: null, lastError: pendingMessage, lastCheckedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await saveEmailDomain(record);
      await saveDomain({ ...domain, registrationStatus: "registered", dnsStatus: "pending", emailVerificationStatus: "pending", provisioningErrors: [...(domain.provisioningErrors ?? []).filter((item) => item.code !== "DNS_AUTOMATION_PENDING"), { code: "DNS_AUTOMATION_PENDING", message: pendingMessage, occurredAt: new Date().toISOString() }], updatedAt: new Date().toISOString() });
      return record;
    }
    record = { ...record, status: "failed", lastError: message, lastCheckedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await saveEmailDomain(record);
    await saveDomain({ ...domain, registrationStatus: "registered", dnsStatus: "failed", emailVerificationStatus: "failed", provisioningErrors: [...(domain.provisioningErrors ?? []), { code: "EMAIL_PROVISIONING_FAILED", message, occurredAt: new Date().toISOString() }], updatedAt: new Date().toISOString() });
    throw error;
  }
}

export async function checkEmailDomainVerification(record: EmailDomainRecord) {
  if (!record.providerDomainId || !emailDomainProvider.isConfigured()) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  const result = await startVerificationIfNeeded(record, await emailDomainProvider.getVerificationStatus(record.providerDomainId), false);
  const now = new Date().toISOString();
  const verificationNeverStarted = result.status === "not_started" && Boolean(record.verificationRequestedAt) && Date.now() - Date.parse(record.verificationRequestedAt ?? "") > EMAIL_DOMAIN_VERIFICATION_RETRY_DELAY_MS;
  const failed = result.status === "failed" || verificationNeverStarted;
  const updated: EmailDomainRecord = { ...record, status: result.status === "verified" ? "ready" : failed ? "failed" : "verifying", verifiedAt: result.status === "verified" ? record.verifiedAt ?? now : record.verifiedAt, lastCheckedAt: now, lastError: failed ? "The email provider could not verify the DNS records. Retry email setup." : null, updatedAt: now };
  await saveEmailDomain(updated);
  const domain = await getDomain(record.domainId);
  if (domain) {
    await saveDomain({ ...domain, registrationStatus: "registered", dnsStatus: domain.dnsStatus === "failed" ? "pending" : domain.dnsStatus, emailVerificationStatus: updated.status === "ready" ? "verified" : updated.status === "failed" ? "failed" : "pending", updatedAt: now });
    if (updated.status === "ready") await ensureDefaultSender(updated, domain);
  }
  return updated;
}
