import "server-only";

import { adminDb } from "@/lib/licensing/admin-db";
import type { DomainPriceQuote } from "@/lib/domains/provider";
import { COMMON_TLDS, type DomainPricing } from "@/types/domains";

const COLLECTION = "domainPricing";
const DEFAULTS: Record<string, DomainPricing> = Object.fromEntries(COMMON_TLDS.map((tld) => [tld, tld === ".com"
  ? { tld, registrationPriceMinor: 2_400_000, renewalPriceMinor: 3_000_000, transferPriceMinor: null, enabled: true, minimumProfitMinor: 200_000 }
  : { tld, registrationPriceMinor: 0, renewalPriceMinor: 0, transferPriceMinor: null, enabled: false, minimumProfitMinor: 200_000 }]));

export function normalizeTld(tld: string) { const value = tld.trim().toLowerCase(); return value.startsWith(".") ? value : `.${value}`; }
export async function getDomainPricing(tld: string): Promise<DomainPricing | null> {
  const key = normalizeTld(tld); const fallback = DEFAULTS[key] ?? null;
  if (!adminDb) return fallback;
  const snapshot = await adminDb.collection(COLLECTION).doc(key.slice(1)).get();
  return snapshot.exists ? snapshot.data() as DomainPricing : fallback;
}
export async function listDomainPricing() {
  if (!adminDb) return Object.values(DEFAULTS);
  const snapshot = await adminDb.collection(COLLECTION).get(); const configured = snapshot.docs.map((doc) => doc.data() as DomainPricing);
  const map = new Map(Object.values(DEFAULTS).map((item) => [item.tld, item])); configured.forEach((item) => map.set(item.tld, item)); return [...map.values()].sort((a, b) => a.tld.localeCompare(b.tld));
}
export async function saveDomainPricing(value: DomainPricing) {
  const normalized = { ...value, tld: normalizeTld(value.tld), updatedAt: new Date().toISOString() };
  if (!adminDb) throw new Error("Domain pricing storage is unavailable.");
  await adminDb.collection(COLLECTION).doc(normalized.tld.slice(1)).set(normalized, { merge: false }); return normalized;
}
export async function calculateDomainPrice(tld: string) { const value = await getDomainPricing(tld); if (!value?.enabled || value.registrationPriceMinor <= 0) throw new Error("DOMAIN_EXTENSION_NOT_CONFIGURED"); return value.registrationPriceMinor; }
export function quoteCostInNgnMinor(quote: DomainPriceQuote) {
  if (quote.currency === "NGN") return quote.amountMinor;
  if (quote.currency !== "USD") throw new Error("UNSUPPORTED_PROVIDER_CURRENCY");
  const usdRateMinor = Number(process.env.DOMAIN_USD_NGN_RATE_MINOR ?? 0); if (!Number.isInteger(usdRateMinor) || usdRateMinor <= 0) throw new Error("DOMAIN_EXCHANGE_RATE_NOT_CONFIGURED");
  return Math.ceil(quote.amountMinor * usdRateMinor / 100);
}
export function assertProfitable(price: DomainPricing, quote: DomainPriceQuote) {
  if (quote.premium) throw new Error("PREMIUM_DOMAIN_REQUIRES_QUOTE");
  const providerCost = quoteCostInNgnMinor(quote); const feeBps = Number(process.env.DOMAIN_PAYMENT_FEE_BPS ?? 200); const fixedFee = Number(process.env.DOMAIN_PAYMENT_FIXED_FEE_MINOR ?? 0);
  const fees = Math.ceil(price.registrationPriceMinor * feeBps / 10_000) + fixedFee;
  if (price.registrationPriceMinor - providerCost - fees < price.minimumProfitMinor) throw new Error("DOMAIN_PRICE_BELOW_MINIMUM_MARGIN");
  return { providerCostNgnMinor: providerCost, estimatedFeesMinor: fees };
}
export function formatDomainPrice(minor: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(minor / 100); }
