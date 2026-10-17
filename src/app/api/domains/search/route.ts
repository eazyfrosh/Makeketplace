import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getDomainPricing } from "@/lib/domain-pricing";
import { domainServiceUnavailableMessage } from "@/lib/domains/provider";
import { areNewDomainPurchasesEnabled, canCallerPurchaseDomains, defaultDomainProvider } from "@/lib/domains/registry";
import { COMMON_TLDS, normalizeDomain } from "@/types/domains";

const DEFAULT_SEARCH_TLDS = [".com", ".org", ".net", ".uk", ".co", ".info", ".io"];

export async function POST(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Sign in to search for domains." }, { status: 401 });
  const body = await request.json().catch(() => ({})); const raw = normalizeDomain(String(body.domain ?? "")); const name = raw.split(".")[0].replace(/[^a-z0-9-]/g, "");
  if (!name || name.length < 2) return NextResponse.json({ error: "Enter a valid domain name." }, { status: 400 });
  const provider = defaultDomainProvider();
  if (!provider.isConfigured()) return NextResponse.json({ results: [], configured: false, purchasesEnabled: false, message: domainServiceUnavailableMessage, suggestions: [`${name}hq.com`, `${name}online.com`, `${name}app.com`] });
  const requested: string[] = Array.isArray(body.tlds)
    ? body.tlds.filter((t: unknown): t is string => typeof t === "string" && COMMON_TLDS.includes(t))
    : DEFAULT_SEARCH_TLDS;
  const extensions = await Promise.all(requested.map(async (tld) => ({ tld, pricing: await getDomainPricing(tld) })));
  const results = await Promise.all(extensions.map(async ({ tld, pricing }) => {
    const domain = `${name}${tld}`;
    const purchasable = Boolean(pricing?.enabled && pricing.registrationPriceMinor > 0);
    try {
      const found = await provider.searchAvailability(domain);
      return {
        domain,
        tld,
        available: found.available,
        premium: Boolean(found.premium),
        purchasable,
        priceCents: purchasable ? pricing!.registrationPriceMinor : undefined,
        renewalPriceCents: purchasable ? pricing!.renewalPriceMinor : undefined,
        currency: "NGN" as const,
      };
    } catch {
      return {
        domain,
        tld,
        available: false,
        premium: false,
        purchasable,
        priceCents: purchasable ? pricing!.registrationPriceMinor : undefined,
        renewalPriceCents: purchasable ? pricing!.renewalPriceMinor : undefined,
        currency: "NGN" as const,
      };
    }
  }));
  return NextResponse.json({ results, configured: true, provider: provider.name, purchasesEnabled: areNewDomainPurchasesEnabled() && canCallerPurchaseDomains(caller), suggestions: [`${name}hq.com`, `${name}online.com`, `${name}app.com`] });
}
