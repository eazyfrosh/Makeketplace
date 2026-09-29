import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { DomainProviderError, type DomainProvider, type DomainProviderBuyer, type RegisteredDomain } from "@/lib/domains/provider";
import { getRegistrarAccount, saveRegistrarAccount } from "@/lib/domains/registrar-account-store";
import { normalizeDomain, type DnsRecord, type Registrant } from "@/types/domains";

type ConnectorResponse = Record<string, unknown> & { ok?: boolean; domain?: string; status?: string; code?: string; message?: string };

function configuration() {
  const url = process.env.RESELLERCLUB_CONNECTOR_URL?.trim().replace(/\/$/, "");
  const secret = process.env.RESELLERCLUB_CONNECTOR_SECRET?.trim();
  return url && secret && secret.length >= 32 ? { url, secret } : null;
}

export function isDomainConnectorConfigured() { return configuration() !== null; }

async function connectorRequest(path: string, payload: Record<string, unknown>) {
  const config = configuration();
  if (!config) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", "Domain service is not configured.");
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", config.secret).update(`${timestamp}\n${nonce}\n${body}`).digest("hex");
  let response: Response;
  try {
    response = await fetch(`${config.url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EazyTool-Timestamp": timestamp, "X-EazyTool-Nonce": nonce, "X-EazyTool-Signature": signature },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch { throw new DomainProviderError("PROVIDER_UNREACHABLE", "Domain service could not be reached."); }
  const data = await response.json().catch(() => null) as ConnectorResponse | null;
  if (!response.ok || !data?.ok) {
    if (data?.code === "PROVIDER_NOT_CONFIGURED" || data?.code === "REGISTRATION_DISABLED") throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", data.message ?? "Domain purchases are disabled.");
    if (data?.code === "DOMAIN_UNAVAILABLE") throw new DomainProviderError("DOMAIN_UNAVAILABLE", data.message ?? "The domain is unavailable.");
    throw new DomainProviderError(response.status === 401 || response.status === 403 ? "PROVIDER_REJECTED" : "PROVIDER_UNREACHABLE", data?.message ?? data?.code ?? "Domain provider request failed.");
  }
  return data;
}

export async function checkAvailabilityThroughConnector(domain: string) {
  const normalized = normalizeDomain(domain); const data = await connectorRequest("/v1/domains/availability", { domain: normalized });
  if (data.domain !== normalized) throw new DomainProviderError("PROVIDER_REJECTED", "The registrar returned an unexpected domain.");
  return data.status === "available";
}

function registeredDomain(data: ConnectorResponse, fallbackDomain = ""): RegisteredDomain {
  const providerDomainId = String(data.providerDomainId ?? "");
  if (!providerDomainId) throw new DomainProviderError("PROVIDER_REJECTED", "The registrar did not return a domain ID.");
  return { providerDomainId, domain: String(data.domain ?? fallbackDomain), status: String(data.status ?? "pending"), registeredAt: typeof data.registeredAt === "string" ? data.registeredAt : null, expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : null };
}

export class ConnectorDomainProvider implements DomainProvider {
  readonly name = "resellerclub";
  isConfigured() { return isDomainConnectorConfigured(); }
  async searchAvailability(domain: string) { const normalized = normalizeDomain(domain); const data = await connectorRequest("/v1/domains/availability", { domain: normalized }); return { domain: normalized, available: data.status === "available", providerStatus: String(data.status ?? "unknown") }; }
  async getPrice(domain: string, years = 1) { const normalized = normalizeDomain(domain); const data = await connectorRequest("/v1/domains/price", { domain: normalized, years }); const amountMinor = Number(data.amountMinor); if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new DomainProviderError("PROVIDER_REJECTED", "The registrar returned an invalid price."); return { domain: normalized, years, currency: String(data.currency ?? ""), amountMinor }; }
  async ensureBuyerAccount(input: { userId: string; registrant: Registrant }): Promise<DomainProviderBuyer> {
    const existing = await getRegistrarAccount(input.userId); if (existing?.providerCustomerId && existing.providerContactId) return { providerCustomerId: existing.providerCustomerId, providerContactId: existing.providerContactId };
    const data = await connectorRequest("/v1/domains/buyers/ensure", { registrant: input.registrant }); const providerCustomerId = String(data.providerCustomerId ?? ""); const providerContactId = String(data.providerContactId ?? "");
    if (!providerCustomerId || !providerContactId) throw new DomainProviderError("PROVIDER_REJECTED", "The registrar did not return buyer contact IDs.");
    const now = new Date().toISOString(); await saveRegistrarAccount({ userId: input.userId, provider: "resellerclub", providerCustomerId, providerContactId, customerEmail: input.registrant.email, createdAt: existing?.createdAt ?? now, updatedAt: now }); return { providerCustomerId, providerContactId };
  }
  async registerDomain(input: { domain: string; years: number; registrant: Registrant; buyer: DomainProviderBuyer; idempotencyKey: string }) { const domain = normalizeDomain(input.domain); return registeredDomain(await connectorRequest("/v1/domains/register", { domain, years: input.years, buyer: input.buyer, idempotencyKey: input.idempotencyKey }), domain); }
  async getRegistrationStatus(providerDomainId: string) { return registeredDomain(await connectorRequest("/v1/domains/status", { providerDomainId })); }
  async getNameservers(providerDomainId: string) { const data = await connectorRequest("/v1/domains/nameservers", { providerDomainId }); return Array.isArray(data.nameservers) ? data.nameservers.map(String) : []; }
  async createDnsRecord(providerDomainId: string, record: DnsRecord) { await connectorRequest("/v1/domains/dns/create", { providerDomainId, record }); }
  async updateDnsRecord(providerDomainId: string, current: DnsRecord, next: DnsRecord) { await connectorRequest("/v1/domains/dns/update", { providerDomainId, current, next }); }
  async removeDnsRecord(providerDomainId: string, record: DnsRecord) { await connectorRequest("/v1/domains/dns/remove", { providerDomainId, record }); }
  async getDnsStatus(providerDomainId: string) { const data = await connectorRequest("/v1/domains/dns/list", { providerDomainId }); return Array.isArray(data.records) ? data.records as DnsRecord[] : []; }
  async renewDomain(input: { providerDomainId: string; domain: string; years: number; currentExpiration: string }) { return registeredDomain(await connectorRequest("/v1/domains/renew", input), input.domain); }
  async getExpiration(providerDomainId: string) { return (await this.getRegistrationStatus(providerDomainId)).expiresAt; }
}

export const connectorDomainProvider = new ConnectorDomainProvider();

// Exported for focused unit tests without revealing the configured secret.
export function signaturesMatch(expectedHex: string, suppliedHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(expectedHex) || !/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  return timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(suppliedHex, "hex"));
}
