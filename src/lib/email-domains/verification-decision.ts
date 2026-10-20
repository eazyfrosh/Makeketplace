import type { EmailDomainRecord, EmailProviderDomain } from "@/lib/email-domains/types";

export const EMAIL_DOMAIN_VERIFICATION_RETRY_DELAY_MS = 10 * 60_000;

export function shouldRequestEmailDomainVerification(
  record: Pick<EmailDomainRecord, "dnsConfiguredAt" | "verificationRequestedAt" | "status">,
  providerStatus: EmailProviderDomain["status"],
  allowRetry: boolean,
) {
  if (!record.dnsConfiguredAt || providerStatus === "verified") return false;
  if (!record.verificationRequestedAt) return providerStatus === "not_started" || providerStatus === "failed";
  if (!allowRetry || (providerStatus !== "failed" && providerStatus !== "not_started")) return false;
  const requestedAt = Date.parse(record.verificationRequestedAt);
  return !Number.isFinite(requestedAt) || Date.now() - requestedAt >= EMAIL_DOMAIN_VERIFICATION_RETRY_DELAY_MS;
}
