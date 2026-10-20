import type { DnsRecord, Registrant } from "@/types/domains";

export type DomainProviderErrorCode = "PROVIDER_NOT_CONFIGURED" | "DOMAIN_UNAVAILABLE" | "PREMIUM_DOMAIN" | "INSUFFICIENT_PROVIDER_FUNDS" | "PROVIDER_REJECTED" | "PROVIDER_UNREACHABLE" | "PROVIDER_OUTCOME_UNKNOWN" | "UNSUPPORTED_OPERATION" | "DNS_RECORD_ALREADY_EXISTS";

export class DomainProviderError extends Error {
  constructor(public readonly code: DomainProviderErrorCode, message: string) {
    super(message);
    this.name = "DomainProviderError";
  }
}

export interface DomainSearchResult { domain: string; available: boolean; providerStatus: string; premium?: boolean; providerPriceMinor?: number; providerCurrency?: string; }
export interface DomainPriceQuote { domain: string; years: number; currency: string; amountMinor: number; premium?: boolean; }
export interface DomainProviderStatus { configured: boolean; environment: "test" | "production"; balanceMinor?: number; currency?: string; }
export interface RegisteredDomain { providerDomainId: string; providerReference?: string; domain: string; status: string; registeredAt: string | null; expiresAt: string | null; }
export interface DomainProviderBuyer { providerCustomerId: string; providerContactId: string; }

export interface DomainProvider {
  readonly name: string;
  isConfigured(): boolean;
  searchAvailability(domain: string): Promise<DomainSearchResult>;
  getPrice(domain: string, years?: number): Promise<DomainPriceQuote>;
  ensureBuyerAccount(input: { userId: string; registrant: Registrant }): Promise<DomainProviderBuyer>;
  registerDomain(input: { domain: string; years: number; registrant: Registrant; buyer: DomainProviderBuyer; idempotencyKey: string }): Promise<RegisteredDomain>;
  getRegistrationStatus(providerDomainId: string): Promise<RegisteredDomain>;
  getNameservers(providerDomainId: string): Promise<string[]>;
  createDnsRecord(providerDomainId: string, record: DnsRecord): Promise<void>;
  updateDnsRecord(providerDomainId: string, current: DnsRecord, next: DnsRecord): Promise<void>;
  removeDnsRecord(providerDomainId: string, record: DnsRecord): Promise<void>;
  getDnsStatus(providerDomainId: string): Promise<DnsRecord[]>;
  renewDomain(input: { providerDomainId: string; domain: string; years: number; currentExpiration: string }): Promise<RegisteredDomain>;
  getExpiration(providerDomainId: string): Promise<string | null>;
  getStatus?(): Promise<DomainProviderStatus>;
  transferDomain?(input: { domain: string; authCode: string; years: number; registrant: Registrant; idempotencyKey: string }): Promise<RegisteredDomain>;
}

export const domainServiceUnavailableMessage = "Domain service is being configured. Please try again later.";

export function requireDomainProvider(provider: DomainProvider) {
  if (!provider.isConfigured()) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", domainServiceUnavailableMessage);
  return provider;
}
