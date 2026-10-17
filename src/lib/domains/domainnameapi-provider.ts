import "server-only";

import { createHash } from "node:crypto";
import { DomainProviderError, type DomainProvider, type DomainProviderStatus, type RegisteredDomain } from "@/lib/domains/provider";
import { normalizeDomain, type DnsRecord, type Registrant } from "@/types/domains";

type Environment = "test" | "production";
type Config = { resellerId: string; apiKey: string; baseUrl: string; environment: Environment; nameservers: string[] };
type Json = Record<string, unknown>;
type ZoneRecordSet = { name?: unknown; ttl?: unknown; type?: unknown; records?: unknown };

const PROD_URL = "https://api.domainresellerapi.com/api/v1";
const TEST_URL = "https://ote.domainresellerapi.com/api/v1";
let requestTail: Promise<void> = Promise.resolve();
let nextRequestAt = 0;

async function paceRequest(chargeable: boolean) {
  const minimumGap = chargeable ? 3_000 : 550;
  const turn = requestTail.then(async () => {
    const wait = Math.max(0, nextRequestAt - Date.now());
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    nextRequestAt = Date.now() + minimumGap;
  });
  requestTail = turn.catch(() => undefined);
  await turn;
}

function config(): Config | null {
  const resellerId = process.env.DOMAINNAMEAPI_RESELLER_ID?.trim();
  const apiKey = process.env.DOMAINNAMEAPI_API_KEY?.trim();
  const environment: Environment = process.env.DOMAINNAMEAPI_ENVIRONMENT === "production" ? "production" : "test";
  const baseUrl = (process.env.DOMAINNAMEAPI_BASE_URL?.trim() || (environment === "production" ? PROD_URL : TEST_URL)).replace(/\/$/, "");
  const nameservers = (process.env.DOMAINNAMEAPI_DEFAULT_NAMESERVERS || "ns1.domainnameapi.com,ns2.domainnameapi.com").split(",").map((value) => value.trim()).filter(Boolean);
  if (!resellerId || !apiKey || nameservers.length < 2) return null;
  return { resellerId, apiKey, baseUrl, environment, nameservers };
}

function providerMessage(status: number, body: Json | null) {
  const nestedError = asObject(body?.error);
  const rawCode = String(body?.code ?? body?.errorCode ?? nestedError.code ?? nestedError.Code ?? "").replace(/^API_/i, "");
  if (status === 429 || rawCode === "361") return "The domain provider is temporarily busy. Please try again shortly.";
  if (rawCode === "350") return "The domain provider account has insufficient funds.";
  if (rawCode === "362") return "This premium domain cannot be registered at the standard price.";
  if (status === 401 || status === 403 || rawCode === "301") return "Domain provider authentication or IP authorization failed.";
  return "The domain provider rejected the request.";
}

function providerEnvelopeError(body: Json) {
  const nestedError = asObject(body.error);
  const rawCode = body.errorCode ?? body.code ?? nestedError.code;
  const success = body.success ?? body.isSuccess ?? body.IsSuccess;
  const explicitFailure = String(body.result ?? "").toUpperCase() === "ERROR" || String(body.OperationResult ?? "").toUpperCase() === "FAILED" || success === false;
  if (explicitFailure) return true;
  if (success === true) return false;
  return rawCode !== undefined && String(rawCode) !== "0" && String(rawCode).toLowerCase() !== "success";
}

async function request<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: unknown, chargeable = false): Promise<T> {
  const current = config();
  if (!current) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", "Domain Name API credentials are not configured.");
  const url = new URL(`${current.baseUrl}/${path.replace(/^\//, "")}`);
  const options: RequestInit = { method, cache: "no-store", headers: { "X-API-KEY": current.apiKey, "__reseller": current.resellerId, Accept: "application/json", "Content-Type": "application/json" } };
  if (method === "GET" || method === "DELETE") {
    if (data && typeof data === "object") for (const [key, value] of Object.entries(data as Json)) if (value !== undefined) url.searchParams.set(key, String(value));
  } else if (data !== undefined) options.body = JSON.stringify(data);
  const attempts = chargeable ? 1 : 2;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await paceRequest(chargeable);
    let response: Response;
    try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) }); }
    catch {
      if (!chargeable && attempt + 1 < attempts) continue;
      throw new DomainProviderError(chargeable ? "PROVIDER_OUTCOME_UNKNOWN" : "PROVIDER_UNREACHABLE", chargeable ? "The provider response is uncertain and requires reconciliation." : "Domain Name API could not be reached.");
    }
    const body = await response.json().catch(() => null) as T & Json | null;
    // Several successful DNS write endpoints intentionally return HTTP 200
    // without a JSON response body. The HTTP status is authoritative there.
    if (response.ok && (body === null || !providerEnvelopeError(body))) return (body ?? {}) as T;
    const message = providerMessage(response.status, body);
    if (!chargeable && attempt + 1 < attempts && (response.status === 429 || /temporarily busy/i.test(message))) continue;
    if (/insufficient funds/i.test(message)) throw new DomainProviderError("INSUFFICIENT_PROVIDER_FUNDS", message);
    if (/premium domain/i.test(message)) throw new DomainProviderError("PREMIUM_DOMAIN", message);
    throw new DomainProviderError("PROVIDER_REJECTED", message);
  }
  throw new DomainProviderError("PROVIDER_UNREACHABLE", "Domain Name API could not be reached.");
}

function contact(registrant: Registrant, type: "Administrative" | "Billing" | "Technical" | "Registrant") {
  const parts = registrant.name.trim().split(/\s+/); const firstName = parts.shift() || registrant.name; const lastName = parts.join(" ") || firstName;
  const digits = (registrant.phone || "").replace(/\D/g, ""); const countryCode = registrant.country === "NG" ? "234" : "1"; const phone = digits.startsWith(countryCode) ? digits.slice(countryCode.length) : digits.replace(/^0/, "");
  const contactType = type === "Administrative" ? "Admin" : type === "Technical" ? "Tech" : type;
  return { contactType, firstName, lastName, companyName: registrant.organization || "N/A", eMail: registrant.email, address: registrant.address || "", city: registrant.city || "", country: registrant.country || "NG", state: registrant.state || "", postalCode: registrant.postalCode || "", phone, phoneCountryCode: countryCode, fax: phone, faxCountryCode: countryCode, discloseFlag: false };
}

function contacts(registrant: Registrant) { return (["Administrative", "Billing", "Technical", "Registrant"] as const).map((type) => contact(registrant, type)); }
function asObject(value: unknown): Json { return value && typeof value === "object" ? value as Json : {}; }
function parseDate(value: unknown) { return typeof value === "string" && value ? value : null; }
function mapDomain(domain: string, payload: Json): RegisteredDomain {
  const dates = asObject(payload.dates ?? payload.Dates);
  const normalized = normalizeDomain(String(payload.domainName ?? payload.DomainName ?? domain));
  const reference = payload.domainId ?? payload.id ?? payload.ID ?? payload.orderId;
  return { providerDomainId: normalized, providerReference: reference === undefined ? undefined : String(reference), domain: normalized, status: String(payload.status ?? payload.Status ?? "pending"), registeredAt: parseDate(dates.start ?? dates.Start ?? payload.startDate), expiresAt: parseDate(payload.expirationDate ?? dates.expiration ?? dates.Expiration) };
}

function tldParts(domain: string) { const normalized = normalizeDomain(domain); const pieces = normalized.split("."); return { name: pieces[0], tld: pieces.slice(1).join(".") }; }

const SUPPORTED_DNS_TYPES = new Set<DnsRecord["type"]>(["A", "AAAA", "CNAME", "MX", "TXT"]);

function relativeDnsHost(host: string, domain: string) {
  const normalizedHost = host.trim().replace(/\.$/, "").toLowerCase();
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedHost || normalizedHost === "@" || normalizedHost === normalizedDomain) return "";
  const suffix = `.${normalizedDomain}`;
  return normalizedHost.endsWith(suffix) ? normalizedHost.slice(0, -suffix.length) : normalizedHost;
}

function qualifiedDnsHost(host: string, domain: string) {
  const relative = relativeDnsHost(host, domain);
  return relative ? `${relative}.${normalizeDomain(domain)}` : normalizeDomain(domain);
}

function providerDnsContent(record: DnsRecord) {
  if (record.type === "MX" && Number.isFinite(record.priority) && !/^\d+\s+/.test(record.value.trim())) return `${record.priority} ${record.value.trim()}`;
  return record.value.trim();
}

function parseDnsContent(type: DnsRecord["type"], content: string) {
  if (type !== "MX") return { value: content };
  const match = content.trim().match(/^(\d+)\s+(.+)$/);
  return match ? { value: match[2], priority: Number(match[1]) } : { value: content };
}

function parseZoneRecords(domain: string, payload: unknown): DnsRecord[] {
  if (!Array.isArray(payload)) return [];
  const result: DnsRecord[] = [];
  for (const rawSet of payload) {
    const set = rawSet as ZoneRecordSet;
    const type = String(set.type ?? "").toUpperCase() as DnsRecord["type"];
    if (!SUPPORTED_DNS_TYPES.has(type)) continue;
    const ttlValue = Number(set.ttl ?? 3600);
    const ttl = Number.isFinite(ttlValue) ? Math.min(86400, Math.max(1, Math.trunc(ttlValue))) : 3600;
    const host = relativeDnsHost(String(set.name ?? ""), domain);
    if (!Array.isArray(set.records)) continue;
    for (const rawRecord of set.records) {
      const row = asObject(rawRecord);
      if (row.disabled === true || typeof row.content !== "string" || !row.content.trim()) continue;
      const parsed = parseDnsContent(type, row.content.trim());
      result.push({ host, type, value: parsed.value, ttl, ...(parsed.priority === undefined ? {} : { priority: parsed.priority }) });
    }
  }
  return result;
}

export class DomainNameApiProvider implements DomainProvider {
  readonly name = "domainnameapi";
  isConfigured() { return config() !== null; }
  async searchAvailability(domain: string) {
    const normalized = normalizeDomain(domain); const { name, tld } = tldParts(normalized);
    const response = await request<Json>("POST", "domains/search", { domainName: normalized });
    const item = asObject(response.info); const status = String(item.status ?? "unknown").trim().toLowerCase(); const price = Number(item.price);
    return { domain: normalized, available: ["available", "1", "true"].includes(status), providerStatus: status, premium: Boolean(item.isPremium), providerPriceMinor: Number.isFinite(price) ? Math.round(price * 100) : undefined, providerCurrency: typeof item.currency === "string" ? item.currency : undefined, name, tld };
  }
  async getPrice(domain: string, years = 1) {
    const availability = await this.searchAvailability(domain);
    if (availability.premium) throw new DomainProviderError("PREMIUM_DOMAIN", "Premium domains require an explicit provider quote.");
    if (availability.providerPriceMinor === undefined || !availability.providerCurrency) throw new DomainProviderError("PROVIDER_REJECTED", "Domain Name API did not return an authoritative price.");
    return { domain: normalizeDomain(domain), years, amountMinor: availability.providerPriceMinor, currency: availability.providerCurrency, premium: false };
  }
  async ensureBuyerAccount(input: { userId: string; registrant: Registrant }) { return { providerCustomerId: input.userId, providerContactId: createHash("sha256").update(`${input.userId}:${input.registrant.email}`).digest("hex") }; }
  async registerDomain(input: { domain: string; years: number; registrant: Registrant; idempotencyKey: string }) {
    void input.idempotencyKey;
    const current = config(); if (!current) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", "Domain Name API is not configured.");
    const result = await request<Json>("POST", "domains/register-with-contacts", { domainName: normalizeDomain(input.domain), period: input.years, nameServers: current.nameservers, contacts: contacts(input.registrant), tldAttributes: {} }, true);
    return mapDomain(input.domain, result);
  }
  async getRegistrationStatus(providerDomainId: string) { const result = await request<Json>("GET", "domains/info", { DomainName: providerDomainId }); return mapDomain(providerDomainId, result); }
  async getNameservers(providerDomainId: string) { const result = await request<Json>("GET", "domains/info", { DomainName: providerDomainId }); const values = result.nameservers ?? result.nameServers ?? result.NameServers; return Array.isArray(values) ? values.map(String) : []; }
  private async applyDnsRecords(domain: string) { await request<Json>("POST", `domains/zones/apply?domainName=${encodeURIComponent(normalizeDomain(domain))}`, {}); }
  private async setDnsRecordSet(domain: string, host: string, type: DnsRecord["type"], records: DnsRecord[], ttl: number) {
    if (!SUPPORTED_DNS_TYPES.has(type)) throw new DomainProviderError("UNSUPPORTED_OPERATION", `DNS record type ${type} is not supported.`);
    const contents = records.map(providerDnsContent).filter(Boolean);
    if (!contents.length) return;
    await request<Json>("POST", `domains/zones?domainName=${encodeURIComponent(normalizeDomain(domain))}`, { zoneStruct: { name: relativeDnsHost(host, domain), ttl: Math.min(86400, Math.max(1, Math.trunc(ttl || 3600))), type, contents: [...new Set(contents)] } });
  }
  async createDnsRecord(providerDomainId: string, record: DnsRecord) {
    const domain = normalizeDomain(providerDomainId);
    const existing = await this.getDnsStatus(domain);
    const sameSet = existing.filter((item) => relativeDnsHost(item.host, domain) === relativeDnsHost(record.host, domain) && item.type === record.type);
    const content = providerDnsContent(record);
    if (sameSet.some((item) => providerDnsContent(item) === content)) {
      // A previous request may have staged the record but stopped before the
      // provider's separate apply step. Applying here makes retries recover.
      await this.applyDnsRecords(domain);
      return;
    }
    await this.setDnsRecordSet(domain, record.host, record.type, [...sameSet, record], record.ttl);
    await this.applyDnsRecords(domain);
  }
  async updateDnsRecord(providerDomainId: string, current: DnsRecord, next: DnsRecord) {
    const domain = normalizeDomain(providerDomainId);
    const currentHost = relativeDnsHost(current.host, domain);
    const nextHost = relativeDnsHost(next.host, domain);
    if (currentHost !== nextHost || current.type !== next.type) {
      await this.removeDnsRecord(domain, current);
      await this.createDnsRecord(domain, next);
      return;
    }
    const existing = await this.getDnsStatus(domain);
    const values = existing.filter((item) => relativeDnsHost(item.host, domain) === currentHost && item.type === current.type && providerDnsContent(item) !== providerDnsContent(current));
    await this.setDnsRecordSet(domain, next.host, next.type, [...values, next], next.ttl);
    await this.applyDnsRecords(domain);
  }
  async removeDnsRecord(providerDomainId: string, record: DnsRecord) {
    const domain = normalizeDomain(providerDomainId);
    const host = relativeDnsHost(record.host, domain);
    const existing = await this.getDnsStatus(domain);
    const sameSet = existing.filter((item) => relativeDnsHost(item.host, domain) === host && item.type === record.type);
    const remaining = sameSet.filter((item) => providerDnsContent(item) !== providerDnsContent(record));
    if (remaining.length === sameSet.length) return;
    if (remaining.length) await this.setDnsRecordSet(domain, host, record.type, remaining, remaining[0].ttl);
    else await request<Json>("DELETE", "domains/zones", { domainName: domain, Name: qualifiedDnsHost(host, domain), Record: providerDnsContent(record), RecordType: record.type });
    await this.applyDnsRecords(domain);
  }
  async getDnsStatus(providerDomainId: string) {
    const domain = normalizeDomain(providerDomainId);
    const result = await request<unknown>("GET", "domains/zones", { domainName: domain });
    return parseZoneRecords(domain, result);
  }
  async renewDomain(input: { providerDomainId: string; domain: string; years: number }) { const result = await request<Json>("POST", "domains/renew", { domainName: input.domain, period: input.years }, true); return mapDomain(input.domain, { ...result, id: input.providerDomainId }); }
  async getExpiration(providerDomainId: string) { return (await this.getRegistrationStatus(providerDomainId)).expiresAt; }
  async transferDomain(input: { domain: string; authCode: string; years: number; registrant: Registrant; idempotencyKey: string }) { void input.idempotencyKey; const result = await request<Json>("POST", "domains/transfer", { domainName: normalizeDomain(input.domain), authCode: input.authCode, period: input.years, contacts: contacts(input.registrant) }, true); return mapDomain(input.domain, result); }
  async getStatus(): Promise<DomainProviderStatus> { const current = config(); if (!current) return { configured: false, environment: "test" }; const result = await request<Json>("GET", "deposit/accounts/me", { currency: "USD" }); const value = Number(result.usdBalance ?? 0); return { configured: true, environment: current.environment, balanceMinor: Number.isFinite(value) ? Math.round(value * 100) : undefined, currency: "USD" }; }
}

export const domainNameApiProvider = new DomainNameApiProvider();
