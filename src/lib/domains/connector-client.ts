import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { DomainProviderError } from "@/lib/domains/provider";
import { normalizeDomain } from "@/types/domains";

type ConnectorResponse = { ok?: boolean; domain?: string; status?: string; code?: string };

function configuration() {
  const url = process.env.RESELLERCLUB_CONNECTOR_URL?.trim().replace(/\/$/, "");
  const secret = process.env.RESELLERCLUB_CONNECTOR_SECRET?.trim();
  return url && secret && secret.length >= 32 ? { url, secret } : null;
}

export function isDomainConnectorConfigured() { return configuration() !== null; }

export async function checkAvailabilityThroughConnector(domain: string) {
  const config = configuration();
  if (!config) throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", "Domain availability is not configured.");
  const body = JSON.stringify({ domain: normalizeDomain(domain) });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", config.secret).update(`${timestamp}\n${nonce}\n${body}`).digest("hex");
  let response: Response;
  try {
    response = await fetch(`${config.url}/v1/domains/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EazyTool-Timestamp": timestamp, "X-EazyTool-Nonce": nonce, "X-EazyTool-Signature": signature },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch { throw new DomainProviderError("PROVIDER_UNREACHABLE", "Domain availability service could not be reached."); }
  const data = await response.json().catch(() => null) as ConnectorResponse | null;
  if (!response.ok || !data?.ok || data.domain !== normalizeDomain(domain)) throw new DomainProviderError(response.status === 401 ? "PROVIDER_REJECTED" : "PROVIDER_UNREACHABLE", data?.code ?? "Domain availability check failed.");
  return data.status === "available";
}

// Exported for focused unit tests without revealing the configured secret.
export function signaturesMatch(expectedHex: string, suppliedHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(expectedHex) || !/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  return timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(suppliedHex, "hex"));
}
