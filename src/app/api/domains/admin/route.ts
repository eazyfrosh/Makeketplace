import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { listDomains, listDomainOrders } from "@/lib/domains/store";
import { domainNameApiProvider } from "@/lib/domains/domainnameapi-provider";
import { areDomainRenewalsEnabled, areDomainTransfersEnabled, areNewDomainPurchasesEnabled } from "@/lib/domains/registry";
import { listDomainPricing, saveDomainPricing } from "@/lib/domain-pricing";

const pricingSchema = z.object({ tld: z.string().regex(/^\.[a-z0-9.]{2,30}$/), registrationPriceMinor: z.number().int().min(0), renewalPriceMinor: z.number().int().min(0), transferPriceMinor: z.number().int().min(0).nullable(), enabled: z.boolean(), minimumProfitMinor: z.number().int().min(0) });

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request); if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? ""; const [domains, orders, pricing] = await Promise.all([listDomains(), listDomainOrders(), listDomainPricing()]);
  const filteredOrders = q ? orders.filter((o) => `${o.domain} ${o.userId} ${o.paystackReference} ${o.registrarOrderId ?? ""} ${o.provider ?? ""}`.toLowerCase().includes(q)) : orders;
  const revenueCents = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, order) => sum + order.amountCents, 0);
  let providerStatus = { configured: domainNameApiProvider.isConfigured(), environment: process.env.DOMAINNAMEAPI_ENVIRONMENT === "production" ? "production" : "test" as "production" | "test" };
  if (new URL(request.url).searchParams.get("test") === "1" && domainNameApiProvider.isConfigured()) providerStatus = { ...providerStatus, ...await domainNameApiProvider.getStatus().catch(() => providerStatus) };
  return NextResponse.json({ provider: { name: "Domain Name API", ...providerStatus, registrationEnabled: areNewDomainPurchasesEnabled(), renewalEnabled: areDomainRenewalsEnabled(), transferEnabled: areDomainTransfersEnabled() }, pricing, summary: { total: domains.length, active: domains.filter((d) => d.status === "active").length, expiring: domains.filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() - Date.now() < 30 * 86400000).length, failed: orders.filter((o) => o.registrationStatus === "failed").length, pending: orders.filter((o) => ["registration_pending", "needs_review"].includes(o.registrationStatus)).length, revenueCents }, orders: filteredOrders });
}

export async function PATCH(request: Request) {
  const admin = await verifyAdminCaller(request); if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = pricingSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Enter valid extension prices in minor units." }, { status: 400 });
  return NextResponse.json({ pricing: await saveDomainPricing(parsed.data) });
}
