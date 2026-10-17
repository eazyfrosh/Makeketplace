import "server-only";

import { createHash } from "node:crypto";
import { DomainProviderError, type DomainProvider, type DomainProviderStatus, type RegisteredDomain } from "@/lib/domains/provider";
import { normalizeDomain, type DnsRecord, type Registrant } from "@/types/domains";

type Environment = "test" | "production";
type Config = { resellerId: string; apiKey: string; baseUrl: string; environment: Environment; nameservers: string[] };
type Json = Record<string, unknown>;

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
  const options: RequestInit = { method, cache: "no-store", headers: { "X-API-KEY": current.apiKey, "__reseller": current.resellerId, Accept: "application/json", "Content-Type": "application/json" }, signal: AbortSignal.timeout(20_000) };
  if (method === "GET" || method === "DELETE") {
    if (data && typeof data === "object") for (const [key, value] of Object.entries(data as Json)) if (value !== undefined) url.searchParams.set(key, String(value));
  } else if (data !== undefined) options.body = JSON.stringify(data);
  await paceRequest(chargeable);
  let response: Response;
  try { response = await fetch(url, options); }
  catch { throw new DomainProviderError(chargeable ? "PROVIDER_OUTCOME_UNKNOWN" : "PROVIDER_UNREACHABLE", chargeable ? "The provider response is uncertain and requires reconciliation." : "Domain Name API could not be reached."); }
  const body = await response.json().catch(() => null) as T & Json | null;
  if (!response.ok || !body || providerEnvelopeError(body)) {
    const message = providerMessage(response.status, body);
    if (/insufficient funds/i.test(message)) throw new DomainProviderError("INSUFFICIENT_PROVIDER_FUNDS", message);
    if (/premium domain/i.test(message)) throw new DomainProviderError("PREMIUM_DOMAIN", message);
    throw new DomainProviderError("PROVIDER_REJECTED", message);
  }
  return body as T;
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
  async createDnsRecord(providerDomainId: string, record: DnsRecord) { void providerDomainId; void record; throw new DomainProviderError("UNSUPPORTED_OPERATION", "DNS record management must be enabled from the Domain Name API account API Library before use."); }
  async updateDnsRecord(providerDomainId: string, current: DnsRecord, next: DnsRecord) { void providerDomainId; void current; void next; throw new DomainProviderError("UNSUPPORTED_OPERATION", "DNS record management must be enabled from the Domain Name API account API Library before use."); }
  async removeDnsRecord(providerDomainId: string, record: DnsRecord) { void providerDomainId; void record; throw new DomainProviderError("UNSUPPORTED_OPERATION", "DNS record management must be enabled from the Domain Name API account API Library before use."); }
  async getDnsStatus(providerDomainId: string) { void providerDomainId; return [] as DnsRecord[]; }
  async renewDomain(input: { providerDomainId: string; domain: string; years: number }) { const result = await request<Json>("POST", "domains/renew", { domainName: input.domain, period: input.years }, true); return mapDomain(input.domain, { ...result, id: input.providerDomainId }); }
  async getExpiration(providerDomainId: string) { return (await this.getRegistrationStatus(providerDomainId)).expiresAt; }
  async transferDomain(input: { domain: string; authCode: string; years: number; registrant: Registrant; idempotencyKey: string }) { void input.idempotencyKey; const result = await request<Json>("POST", "domains/transfer", { domainName: normalizeDomain(input.domain), authCode: input.authCode, period: input.years, contacts: contacts(input.registrant) }, true); return mapDomain(input.domain, result); }
  async getStatus(): Promise<DomainProviderStatus> { const current = config(); if (!current) return { configured: false, environment: "test" }; const result = await request<Json>("GET", "deposit/accounts/me", { currency: "USD" }); const value = Number(result.usdBalance ?? 0); return { configured: true, environment: current.environment, balanceMinor: Number.isFinite(value) ? Math.round(value * 100) : undefined, currency: "USD" }; }
}

export const domainNameApiProvider = new DomainNameApiProvider();
