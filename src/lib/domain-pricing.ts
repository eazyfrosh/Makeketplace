import { COMMON_TLDS, type DomainPricing } from "@/types/domains";

const DEFAULTS: Record<string, DomainPricing> = Object.fromEntries(COMMON_TLDS.map((tld) => [tld, { tld, registrarCostCents: 0, markupCents: 250000, minimumProfitCents: 0 }]));
export const DOMAIN_PRICING: Record<string, DomainPricing> = {
  ...DEFAULTS,
  ".com": {
    ...DEFAULTS[".com"],
    fixedRegistrationPriceMinor: 2_400_000,
    fixedRenewalPriceMinor: 3_000_000,
  },
  ".net": {
    ...DEFAULTS[".net"],
    fixedRegistrationPriceMinor: 2_900_000,
    fixedRenewalPriceMinor: 3_600_000,
  },
  ".org": {
    ...DEFAULTS[".org"],
    fixedRegistrationPriceMinor: 3_100_000,
    fixedRenewalPriceMinor: 3_700_000,
  },
  ".app": {
    ...DEFAULTS[".app"],
    fixedRegistrationPriceMinor: 3_500_000,
    fixedRenewalPriceMinor: 4_200_000,
  },
  ".io": { ...DEFAULTS[".io"], fixedRegistrationPriceMinor: 11_500_000, fixedRenewalPriceMinor: 13_500_000, minimumRegistrationYears: 1, minimumRenewalYears: 1 },
  ".ai": { ...DEFAULTS[".ai"], fixedRegistrationPriceMinor: 39_000_000, fixedRenewalPriceMinor: 41_500_000, minimumRegistrationYears: 2, minimumRenewalYears: 2 },
  ".co": { ...DEFAULTS[".co"], fixedRegistrationPriceMinor: 7_200_000, fixedRenewalPriceMinor: 8_200_000, minimumRegistrationYears: 1, minimumRenewalYears: 1 },
};
export function getDomainPricing(tld: string): DomainPricing { return DOMAIN_PRICING[tld.toLowerCase()] ?? { tld: tld.toLowerCase(), registrarCostCents: 0, markupCents: 300000, minimumProfitCents: 0 }; }
export function calculateDomainPrice(tld: string, registrarCostCents = getDomainPricing(tld).registrarCostCents) { const p = getDomainPricing(tld); return p.fixedRegistrationPriceMinor ?? Math.max(registrarCostCents + p.markupCents, registrarCostCents + p.minimumProfitCents, 50000); }
export function calculateDomainRenewalPrice(tld: string, registrarCostCents = getDomainPricing(tld).registrarCostCents) { const p = getDomainPricing(tld); return p.fixedRenewalPriceMinor ?? Math.max(registrarCostCents + p.markupCents, registrarCostCents + p.minimumProfitCents, 50000); }
export function getDomainRegistrationYears(tld: string) { return getDomainPricing(tld).minimumRegistrationYears ?? 1; }
export function getDomainRenewalYears(tld: string) { return getDomainPricing(tld).minimumRenewalYears ?? 1; }
export function formatDomainPrice(cents: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(cents / 100); }
