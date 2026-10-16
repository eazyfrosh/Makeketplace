import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getDomainPricing } from "@/lib/domain-pricing";
import { domainServiceUnavailableMessage } from "@/lib/domains/provider";
import { areNewDomainPurchasesEnabled, defaultDomainProvider } from "@/lib/domains/registry";
import { COMMON_TLDS, normalizeDomain } from "@/types/domains";

export async function POST(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Sign in to search for domains." }, { status: 401 });
  const body = await request.json().catch(() => ({})); const raw = normalizeDomain(String(body.domain ?? "")); const name = raw.split(".")[0].replace(/[^a-z0-9-]/g, "");
  if (!name || name.length < 2) return NextResponse.json({ error: "Enter a valid domain name." }, { status: 400 });
  const provider = defaultDomainProvider();
  if (!provider.isConfigured()) return NextResponse.json({ results: [], configured: false, purchasesEnabled: false, message: domainServiceUnavailableMessage, suggestions: [`${name}hq.com`, `${name}online.com`, `${name}app.com`] });
  const requested: string[] = Array.isArray(body.tlds) ? body.tlds.filter((t: unknown): t is string => typeof t === "string" && COMMON_TLDS.includes(t)) : COMMON_TLDS;
  const configured = (await Promise.all(requested.map(async (tld) => ({ tld, pricing: await getDomainPricing(tld) })))).filter((item) => item.pricing?.enabled);
  const results = await Promise.all(configured.map(async ({ tld, pricing }) => {
    const domain = `${name}${tld}`;
    try { const found = await provider.searchAvailability(domain); return { domain, tld, available: found.available, premium: Boolean(found.premium), priceCents: pricing!.registrationPriceMinor, renewalPriceCents: pricing!.renewalPriceMinor, currency: "NGN" as const }; }
    catch { return { domain, tld, available: false, premium: false, priceCents: pricing!.registrationPriceMinor, renewalPriceCents: pricing!.renewalPriceMinor, currency: "NGN" as const }; }
  }));
  return NextResponse.json({ results, configured: true, provider: provider.name, purchasesEnabled: areNewDomainPurchasesEnabled(), suggestions: [`${name}hq.com`, `${name}online.com`, `${name}app.com`] });
}
