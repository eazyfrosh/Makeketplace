import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { assertProfitable, calculateDomainPrice, getDomainPricing } from "@/lib/domain-pricing";
import { areNewDomainPurchasesEnabled, canCallerPurchaseDomains, defaultDomainProvider } from "@/lib/domains/registry";
import { getTld, isCompleteRegistrant, isValidDomain, normalizeDomain, sanitizeRegistrant } from "@/types/domains";
import { getDomainForUser, getDomainOrderByReference, saveDomainOrder } from "@/lib/domains/store";
import { registerPaidDomain } from "@/lib/domains/service";
import { listWalletTransactions, refundTransaction } from "@/lib/wallet/store";
import { purchaseWithWallet } from "@/lib/wallet/service";

const origins = { "elite-broker": "https://premium-broker-platform.vercel.app", volterra: "https://tesla-blush-nine.vercel.app" } as const;

async function recoverOrphanedDomainDebit(userId: string, domain: string) {
  if (await getDomainForUser(domain, userId)) return;
  // Keep this query on the existing userId + createdAt index. Filtering by
  // type/status in Firestore would require another composite index and could
  // prevent checkout before any financial work begins.
  const { transactions } = await listWalletTransactions(userId, { limit: 50 });
  const cutoff = Date.now() - 24 * 60 * 60 * 1_000;
  for (const transaction of transactions) {
    if (transaction.type !== "purchase" || transaction.status !== "completed" || transaction.serviceType !== "domain" || transaction.serviceId !== domain || new Date(transaction.createdAt).getTime() < cutoff) continue;
    if (await getDomainOrderByReference(transaction.reference)) continue;
    await refundTransaction({ transactionId: transaction.id, actorUserId: "system", reason: "Automatic recovery for a domain debit whose order was not created.", type: "reversal" });
  }
}

async function handlePost(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!areNewDomainPurchasesEnabled() || !canCallerPurchaseDomains(caller)) return NextResponse.json({ error: "Domain purchases are not available yet. Your wallet was not charged.", code: "DOMAIN_PURCHASES_DISABLED" }, { status: 503 });
  const body = await request.json().catch(() => ({})); const domain = normalizeDomain(String(body.domain ?? ""));
  if (!isValidDomain(domain)) return NextResponse.json({ error: "Enter a valid domain name." }, { status: 400 });
  await recoverOrphanedDomainDebit(caller.uid, domain);
  const provider = defaultDomainProvider(); const availability = await provider.searchAvailability(domain);
  if (!availability.available) return NextResponse.json({ error: "That domain is no longer available." }, { status: 409 });
  if (availability.premium) return NextResponse.json({ error: "Premium domains require a separate confirmed quote." }, { status: 409 });
  const registrant = sanitizeRegistrant({ ...(body.registrant ?? {}), email: caller.email });
  if (!isCompleteRegistrant(registrant) || body.acceptRegistrarTerms !== true) return NextResponse.json({ error: "Complete the registrant details and accept the domain registration terms." }, { status: 400 });
  const suppliedKey = String(body.idempotencyKey ?? ""); const idempotencyKey = /^[a-zA-Z0-9_-]{12,100}$/.test(suppliedKey) ? suppliedKey : crypto.randomBytes(12).toString("hex");
  const reference = `EZT-DOM-${idempotencyKey}`; const pricing = await getDomainPricing(getTld(domain)); if (!pricing?.enabled) return NextResponse.json({ error: "This extension is not available for purchase." }, { status: 409 });
  const quote = availability.providerPriceMinor !== undefined && availability.providerCurrency
    ? { domain, years: 1, amountMinor: availability.providerPriceMinor, currency: availability.providerCurrency, premium: false }
    : await provider.getPrice(domain, 1);
  assertProfitable(pricing, quote); const amountMinor = await calculateDomainPrice(getTld(domain));
  const templateId = body.templateId === "elite-broker" || body.templateId === "volterra" ? body.templateId as keyof typeof origins : undefined;
  const templateSiteId = /^[a-f0-9]{24}$/.test(String(body.templateSiteId ?? "")) ? String(body.templateSiteId) : undefined; const now = new Date().toISOString();
  let debit: Awaited<ReturnType<typeof purchaseWithWallet>> | null = null;
  try {
    debit = await purchaseWithWallet({ userId: caller.uid, authoritativeAmountMinor: amountMinor, reference, description: `Domain registration: ${domain}`, serviceType: "domain", serviceId: domain, metadata: { domain } });
    await saveDomainOrder({ id: `wallet_${reference}`, userId: caller.uid, domain, tld: getTld(domain), amountCents: amountMinor, currency: "NGN", paystackReference: reference, paymentStatus: "paid", registrationStatus: "payment_confirmed", registrarOrderId: null, provider: "domainnameapi", wholesaleAmountMinor: quote.amountMinor, wholesaleCurrency: quote.currency, premium: false, idempotencyKey, refundState: "not_required", registrant, registrarTermsAcceptedAt: now, templateId, templateSiteId, templateSiteUrl: templateId && templateSiteId ? `${origins[templateId]}/site/${templateSiteId}` : undefined, createdAt: now, updatedAt: now });
    const order = await registerPaidDomain(reference, caller.uid, registrant);
    if (order.registrationStatus === "needs_review") return NextResponse.json({ error: "Registration is pending provider reconciliation. Your order has not been retried or refunded yet.", order }, { status: 202 });
    if (!["registered", "email_verification_pending", "email_ready"].includes(order.registrationStatus)) { await refundTransaction({ transactionId: debit.id, actorUserId: "system", reason: `Domain registration failed: ${order.errorMessage ?? "provider did not complete the order"}`, type: "reversal" }); await saveDomainOrder({ ...order, paymentStatus: "refunded", refundState: "completed", updatedAt: new Date().toISOString() }); return NextResponse.json({ error: "Registration did not complete. Your wallet debit was automatically reversed.", order }, { status: 502 }); }
    return NextResponse.json({ order, transaction: debit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet purchase failed.";
    if (debit) {
      try { await refundTransaction({ transactionId: debit.id, actorUserId: "system", reason: `Domain checkout could not create a valid order: ${message}`, type: "reversal" }); }
      catch (refundError) { console.error("[domains/wallet] Failed to reverse incomplete checkout", { transactionId: debit.id, error: refundError instanceof Error ? refundError.message : "unknown" }); }
    }
    console.error("[domains/wallet] Domain checkout failed", { userId: caller.uid, domain, error: message });
    return NextResponse.json({ error: message === "INSUFFICIENT_BALANCE" ? "Insufficient wallet balance. Add funds to continue." : message }, { status: message === "INSUFFICIENT_BALANCE" ? 402 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[domains/wallet] Unhandled checkout failure", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "We could not complete the domain purchase. Your wallet was not charged." },
      { status: 500 },
    );
  }
}
