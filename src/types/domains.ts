export type DomainStatus = "active" | "pending" | "expired" | "suspended" | "registration_failed";
export type DomainPaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type DomainRegistrationStatus = "pending" | "registered" | "failed" | "needs_review";
export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT";

export interface DomainRecord {
  id: string; userId: string; domain: string; tld: string; registrar: "resellerclub";
  registrarOrderId: string | null; status: DomainStatus; registeredAt: string | null; expiresAt: string | null;
  autoRenew: boolean; nameservers: string[]; customerPriceCents: number; currency: "NGN";
  registrant?: Registrant; createdAt: string; updatedAt: string;
}
export interface DomainOrder {
  id: string; userId: string; domain: string; tld: string; amountCents: number; currency: "NGN";
  paystackReference: string; paymentStatus: DomainPaymentStatus; registrationStatus: DomainRegistrationStatus;
  registrarOrderId: string | null; errorMessage?: string; createdAt: string; updatedAt: string;
}
export interface DomainAvailability { domain: string; tld: string; available: boolean; priceCents: number; currency: "NGN"; }
export interface DnsRecord { host: string; type: DnsRecordType; value: string; ttl: number; priority?: number; }
export interface Registrant { name: string; email: string; phone?: string; organization?: string; address?: string; city?: string; state?: string; country?: string; postalCode?: string; }
export interface DomainDetails { domain: string; status: string; expiryDate: string | null; nameservers: string[]; dnsRecords: DnsRecord[]; registrant?: Registrant; }
export interface DomainPricing { tld: string; registrarCostCents: number; markupCents: number; minimumProfitCents: number; }
export interface ResellerClubOptions { resellerId: string; apiKey: string; baseUrl: string; }

export const COMMON_TLDS = [".com", ".net", ".org", ".co", ".io", ".ai", ".app", ".dev", ".me", ".xyz"];
export const DOMAIN_WARNING_DAYS = [30, 14, 7, 1];
export const domainDaysRemaining = (expiresAt: string | null) => expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000) : null;
export const normalizeDomain = (input: string) => input.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
export const isValidDomain = (input: string) => /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(normalizeDomain(input));
export const getTld = (domain: string) => `.${normalizeDomain(domain).split(".").slice(1).join(".")}`;
export const domainPriceNaira = (cents: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(cents / 100);
export const sanitizeRegistrant = (v: Partial<Registrant>): Registrant => ({ name: String(v.name ?? "").trim().slice(0, 120), email: String(v.email ?? "").trim().toLowerCase().slice(0, 160), phone: String(v.phone ?? "").trim().slice(0, 40), organization: String(v.organization ?? "").trim().slice(0, 120), address: String(v.address ?? "").trim().slice(0, 180), city: String(v.city ?? "").trim().slice(0, 80), state: String(v.state ?? "").trim().slice(0, 80), country: String(v.country ?? "NG").trim().slice(0, 2).toUpperCase(), postalCode: String(v.postalCode ?? "").trim().slice(0, 20) });
export const isValidNameserver = (v: string) => /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(v);
export const domainCurrency = "NGN" as const;
export const domainRegistrar = "resellerclub" as const;
export const domainMaxNameservers = 6;
export const domainMaxDnsRecords = 100;
export const domainWebhookRoute = "/api/paystack/webhook";
export const domainDocs = { resellerClub: "https://manage.resellerclub.com/kb/answer/744", paystackWebhook: "https://paystack.com/docs/payments/webhooks/" } as const;
export const domainEnvironmentKeys = ["RESELLERCLUB_RESELLER_ID", "RESELLERCLUB_API_KEY", "RESELLERCLUB_BASE_URL", "PAYSTACK_SECRET_KEY", "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"] as const;
