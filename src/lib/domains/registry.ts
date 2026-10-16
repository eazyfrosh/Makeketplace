import "server-only";

import type { DomainProvider } from "@/lib/domains/provider";
import type { DomainRegistrar } from "@/types/domains";
import { domainNameApiProvider } from "@/lib/domains/domainnameapi-provider";
import { resellerClubDomainProvider } from "@/lib/domains/resellerclub-provider";

const providers: Record<Exclude<DomainRegistrar, "namesilo">, DomainProvider> = { domainnameapi: domainNameApiProvider, resellerclub: resellerClubDomainProvider };

export function defaultDomainProvider() { return domainNameApiProvider; }
export function getDomainProvider(name: DomainRegistrar) {
  if (name === "namesilo") throw new Error("NameSilo management is not installed in this deployment.");
  return providers[name];
}
export function areNewDomainPurchasesEnabled() { return process.env.DOMAIN_PURCHASES_ENABLED === "true" && process.env.DOMAINNAMEAPI_LIVE_OPERATIONS_ENABLED === "true" && process.env.DOMAINNAMEAPI_ENVIRONMENT === "production" && domainNameApiProvider.isConfigured(); }
export function canCallerPurchaseDomains(caller: { role: string }) { return process.env.DOMAIN_PURCHASE_TEST_MODE === "true" ? caller.role === "admin" : true; }
export function areDomainRenewalsEnabled() { return areNewDomainPurchasesEnabled() && process.env.DOMAIN_RENEWALS_ENABLED === "true"; }
export function areDomainTransfersEnabled() { return areNewDomainPurchasesEnabled() && process.env.DOMAIN_TRANSFERS_ENABLED === "true"; }
