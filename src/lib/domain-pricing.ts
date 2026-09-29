import { COMMON_TLDS, type DomainPricing } from "@/types/domains";

const DEFAULTS: Record<string, DomainPricing> = Object.fromEntries(COMMON_TLDS.map((tld) => [tld, { tld, registrarCostCents: 0, markupCents: 250000, minimumProfitCents: 0 }]));
export const DOMAIN_PRICING: Record<string, DomainPricing> = {
  ...DEFAULTS,
  ".com": {
    ...DEFAULTS[".com"],
    fixedRegistrationPriceMinor: 2_400_000,
    fixedRenewalPriceMinor: 3_000_000,
  },
};
export function getDomainPricing(tld: string): DomainPricing { return DOMAIN_PRICING[tld.toLowerCase()] ?? { tld: tld.toLowerCase(), registrarCostCents: 0, markupCents: 300000, minimumProfitCents: 0 }; }
export function calculateDomainPrice(tld: string, registrarCostCents = getDomainPricing(tld).registrarCostCents) { const p = getDomainPricing(tld); return p.fixedRegistrationPriceMinor ?? Math.max(registrarCostCents + p.markupCents, registrarCostCents + p.minimumProfitCents, 50000); }
export function calculateDomainRenewalPrice(tld: string, registrarCostCents = getDomainPricing(tld).registrarCostCents) { const p = getDomainPricing(tld); return p.fixedRenewalPriceMinor ?? Math.max(registrarCostCents + p.markupCents, registrarCostCents + p.minimumProfitCents, 50000); }
export function formatDomainPrice(cents: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(cents / 100); }
