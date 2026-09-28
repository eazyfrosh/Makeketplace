import type { DnsRecord, Registrant } from "@/types/domains";

export type DomainProviderErrorCode = "PROVIDER_NOT_CONFIGURED" | "DOMAIN_UNAVAILABLE" | "PROVIDER_REJECTED" | "PROVIDER_UNREACHABLE";

export class DomainProviderError extends Error {
  constructor(public readonly code: DomainProviderErrorCode, message: string) {
    super(message);
    this.name = "DomainProviderError";
  }
}

export interface DomainSearchResult { domain: string; available: boolean; providerStatus: string; }
export interface DomainPriceQuote { domain: string; years: number; currency: string; amountMinor: number; }
export interface RegisteredDomain { providerDomainId: string; domain: string; status: string; registeredAt: string | null; expiresAt: string | null; }
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
}

export const domainServiceUnavailableMessage = "Domain service is being configured. Please try again later.";

export function requireDomainProvider(provider: DomainProvider) {
  if (!provider.isConfigured()) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", domainServiceUnavailableMessage);
  return provider;
}
