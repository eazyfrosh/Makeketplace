// Compatibility facade. Provider-aware code should use DomainProvider.
import { requireDomainProvider } from "@/lib/domains/provider";
import { resellerClubDomainProvider } from "@/lib/domains/resellerclub-provider";
import { checkAvailabilityThroughConnector, isDomainConnectorConfigured } from "@/lib/domains/connector-client";
import type { DnsRecord, Registrant } from "@/types/domains";

export function isResellerClubConfigured() { return resellerClubDomainProvider.isConfigured(); }
export function isResellerClubAvailabilityConfigured() { return isDomainConnectorConfigured(); }
export function areDomainPurchasesEnabled() { return process.env.DOMAIN_PURCHASES_ENABLED === "true" && isResellerClubConfigured(); }
export async function checkAvailability(domain: string) { return checkAvailabilityThroughConnector(domain); }
export async function registerDomain(input: { userId: string; domain: string; years: number; registrant: Registrant; idempotencyKey?: string }) { const provider = requireDomainProvider(resellerClubDomainProvider); const buyer = await provider.ensureBuyerAccount({ userId: input.userId, registrant: input.registrant }); const result = await provider.registerDomain({ ...input, buyer, idempotencyKey: input.idempotencyKey ?? input.domain }); return { entityid: result.providerDomainId, ...result }; }
export async function renewDomain(domain: string, years = 1) { throw new Error(`Use DomainProvider.renewDomain for ${domain} (${years} years).`); }
export async function getDomainDetails(providerDomainId: string) { return requireDomainProvider(resellerClubDomainProvider).getRegistrationStatus(providerDomainId); }
export async function updateNameservers() { throw new Error("Nameserver changes require the provider domain ID."); }
export async function getDnsRecords(providerDomainId: string) { return requireDomainProvider(resellerClubDomainProvider).getDnsStatus(providerDomainId); }
export async function updateDnsRecords(providerDomainId: string, records: DnsRecord[]) { for (const record of records) await requireDomainProvider(resellerClubDomainProvider).createDnsRecord(providerDomainId, record); }
