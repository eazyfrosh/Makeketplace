import "server-only";

import { DomainProviderError, type DomainProvider, type RegisteredDomain } from "@/lib/domains/provider";
import { getTld, normalizeDomain, type DnsRecord, type Registrant } from "@/types/domains";

type Config = { resellerId: string; apiKey: string; baseUrl: string; customerId: string; contactId?: string; defaultNameservers: string[]; };

function configuration(): Config | null {
  const resellerId = process.env.RESELLERCLUB_RESELLER_ID?.trim();
  const apiKey = process.env.RESELLERCLUB_API_KEY?.trim();
  const baseUrl = process.env.RESELLERCLUB_API_BASE_URL?.trim() || process.env.RESELLERCLUB_BASE_URL?.trim();
  const customerId = process.env.RESELLERCLUB_CUSTOMER_ID?.trim();
  const contactId = process.env.RESELLERCLUB_CONTACT_ID?.trim();
  const defaultNameservers = (process.env.RESELLERCLUB_DEFAULT_NAMESERVERS ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!resellerId || !apiKey || !baseUrl || !customerId || defaultNameservers.length < 2) return null;
  return { resellerId, apiKey, baseUrl: baseUrl.replace(/\/$/, ""), customerId, contactId: contactId || undefined, defaultNameservers };
}

function scalar(value: unknown) { return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : undefined; }

async function request<T>(path: string, method: "GET" | "POST", params: Record<string, unknown>): Promise<T> {
  const config = configuration();
  if (!config) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", "ResellerClub credentials, contact IDs, or nameservers are incomplete.");
  const url = new URL(`${config.baseUrl}/${path.replace(/^\//, "")}`);
  url.searchParams.set("auth-userid", config.resellerId);
  url.searchParams.set("api-key", config.apiKey);
  for (const [key, raw] of Object.entries(params)) for (const value of Array.isArray(raw) ? raw : [raw]) { const parsed = scalar(value); if (parsed !== undefined) url.searchParams.append(key, parsed); }
  let response: Response;
  try { response = await fetch(url, { method, cache: "no-store", signal: AbortSignal.timeout(20_000) }); }
  catch { throw new DomainProviderError("PROVIDER_UNREACHABLE", "ResellerClub could not be reached."); }
  const data = await response.json().catch(() => null) as (T & { status?: string; message?: string; error?: string }) | null;
  if (!response.ok || !data || data.error || data.status === "ERROR") throw new DomainProviderError("PROVIDER_REJECTED", data?.message || data?.error || "ResellerClub rejected the request.");
  return data;
}

function dnsParams(record: DnsRecord) { return { host: record.host, type: record.type, value: record.value, ttl: record.ttl, priority: record.priority }; }
function mapDomain(providerDomainId: string, data: Record<string, unknown>): RegisteredDomain { return { providerDomainId, domain: String(data.domainname ?? data.description ?? ""), status: String(data.currentstatus ?? data.status ?? "pending"), registeredAt: typeof data.creationtime === "string" ? data.creationtime : null, expiresAt: typeof data.endtime === "string" ? data.endtime : typeof data.expirydate === "string" ? data.expirydate : null }; }

export class ResellerClubDomainProvider implements DomainProvider {
  readonly name = "resellerclub";
  isConfigured() { return configuration() !== null; }
  async searchAvailability(domain: string) { const normalized = normalizeDomain(domain); const parts = normalized.split("."); const tld = parts.slice(1).join("."); const name = parts[0]; const data = await request<Record<string, { status?: string }>>("api/domains/available.json", "GET", { "domain-name": name, tlds: tld }); const result = data[normalized] ?? data[`${name}.${tld}`] ?? Object.values(data)[0]; return { domain: normalized, available: result?.status === "available", providerStatus: result?.status ?? "unknown" }; }
  async getPrice(domain: string, years = 1) { const normalized = normalizeDomain(domain); const tld = getTld(normalized); const productKey = `dot${tld.slice(1).replaceAll(".", "")}`; const config = configuration(); if (!config) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", "ResellerClub pricing is not configured."); const prices = await request<Record<string, { addnewdomain?: Record<string, string | number> }>>("api/products/customer-price.json", "GET", { "customer-id": config.customerId }); const major = Number(prices[productKey]?.addnewdomain?.[String(years)]); if (!Number.isFinite(major) || major < 0) throw new DomainProviderError("PROVIDER_REJECTED", `ResellerClub did not return a ${tld} registration price.`); return { domain: normalized, years, currency: process.env.RESELLERCLUB_ACCOUNT_CURRENCY ?? "USD", amountMinor: Math.round(major * 100) }; }
  async registerDomain(input: { domain: string; years: number; registrant: Registrant; idempotencyKey: string }) { const config = configuration(); if (!config) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", "ResellerClub registration is not configured."); const availability = await this.searchAvailability(input.domain); if (!availability.available) throw new DomainProviderError("DOMAIN_UNAVAILABLE", "The domain is no longer available."); const digits = (input.registrant.phone ?? "").replace(/\D/g, ""); const phoneCc = input.registrant.country === "NG" ? "234" : (process.env.RESELLERCLUB_DEFAULT_PHONE_CC ?? "234"); const phone = digits.startsWith(phoneCc) ? digits.slice(phoneCc.length) : digits.replace(/^0/, ""); let contactId = config.contactId; if (!contactId) { const contact = await request<number | { entityid?: string | number }>("api/contacts/add.json", "POST", { name: input.registrant.name, company: input.registrant.organization || "N/A", email: input.registrant.email, "address-line-1": input.registrant.address, city: input.registrant.city, state: input.registrant.state, country: input.registrant.country, zipcode: input.registrant.postalCode, "phone-cc": phoneCc, phone, "customer-id": config.customerId, type: "Contact" }); contactId = String(typeof contact === "number" ? contact : contact.entityid ?? ""); if (!contactId) throw new DomainProviderError("PROVIDER_REJECTED", "ResellerClub did not create the registrant contact."); } const data = await request<Record<string, unknown>>("api/domains/register.json", "POST", { "domain-name": normalizeDomain(input.domain), years: input.years, ns: config.defaultNameservers, "customer-id": config.customerId, "reg-contact-id": contactId, "admin-contact-id": contactId, "tech-contact-id": contactId, "billing-contact-id": contactId, "invoice-option": "KeepInvoice", "purchase-privacy": true }); const providerDomainId = String(data.entityid ?? data.orderid ?? ""); if (!providerDomainId) throw new DomainProviderError("PROVIDER_REJECTED", "ResellerClub did not return a domain order ID."); return mapDomain(providerDomainId, { ...data, domainname: input.domain }); }
  async getRegistrationStatus(providerDomainId: string) { const data = await request<Record<string, unknown>>("api/domains/details-by-id.json", "GET", { "order-id": providerDomainId, options: "All" }); return mapDomain(providerDomainId, data); }
  async getNameservers(providerDomainId: string) { const data = await request<{ ns?: string[] }>("api/domains/details-by-id.json", "GET", { "order-id": providerDomainId, options: "NsDetails" }); return data.ns ?? []; }
  async createDnsRecord(providerDomainId: string, record: DnsRecord) { await request("api/dns/manage/add-record.json", "POST", { "order-id": providerDomainId, ...dnsParams(record) }); }
  async updateDnsRecord(providerDomainId: string, current: DnsRecord, next: DnsRecord) { await request("api/dns/manage/update-record.json", "POST", { "order-id": providerDomainId, ...dnsParams(next), "current-value": current.value, "current-host": current.host }); }
  async removeDnsRecord(providerDomainId: string, record: DnsRecord) { await request("api/dns/manage/delete-record.json", "POST", { "order-id": providerDomainId, ...dnsParams(record) }); }
  async getDnsStatus(providerDomainId: string) { const data = await request<{ records?: DnsRecord[] }>("api/dns/manage/search-records.json", "GET", { "order-id": providerDomainId, "no-of-records": 100, "page-no": 1 }); return data.records ?? []; }
  async renewDomain(input: { providerDomainId: string; domain: string; years: number; currentExpiration: string }) { const data = await request<Record<string, unknown>>("api/domains/renew.json", "POST", { "order-id": input.providerDomainId, years: input.years, "exp-date": Math.floor(new Date(input.currentExpiration).getTime() / 1000), "invoice-option": "KeepInvoice" }); return mapDomain(input.providerDomainId, { ...data, domainname: input.domain }); }
  async getExpiration(providerDomainId: string) { return (await this.getRegistrationStatus(providerDomainId)).expiresAt; }
}

export const resellerClubDomainProvider = new ResellerClubDomainProvider();
