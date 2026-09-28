import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { calculateDomainPrice } from "@/lib/domain-pricing";
import { checkAvailability, isResellerClubConfigured } from "@/lib/resellerclub";
import { getTld, isCompleteRegistrant, isValidDomain, normalizeDomain, sanitizeRegistrant } from "@/types/domains";
import { saveDomainOrder } from "@/lib/domains/store";
import { registerPaidDomain } from "@/lib/domains/service";
import { refundTransaction } from "@/lib/wallet/store";
import { purchaseWithWallet } from "@/lib/wallet/service";
import { domainServiceUnavailableMessage } from "@/lib/domains/provider";

const origins = { "elite-broker": "https://premium-broker-platform.vercel.app", volterra: "https://tesla-blush-nine.vercel.app" } as const;

export async function POST(request: Request) {
  const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({})); const domain = normalizeDomain(String(body.domain ?? ""));
  if (!isValidDomain(domain)) return NextResponse.json({ error: "Enter a valid domain name." }, { status: 400 });
  if (!isResellerClubConfigured()) return NextResponse.json({ error: domainServiceUnavailableMessage, code: "PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  if (!(await checkAvailability(domain))) return NextResponse.json({ error: "That domain is no longer available." }, { status: 409 });
  const registrant = sanitizeRegistrant({ ...(body.registrant ?? {}), email: caller.email });
  if (!isCompleteRegistrant(registrant) || body.acceptRegistrarTerms !== true) return NextResponse.json({ error: "Complete the registrant details and accept the domain registration terms." }, { status: 400 });
  const suppliedKey = String(body.idempotencyKey ?? ""); const idempotencyKey = /^[a-zA-Z0-9_-]{12,100}$/.test(suppliedKey) ? suppliedKey : crypto.randomBytes(12).toString("hex");
  const reference = `EZT-DOM-${idempotencyKey}`; const amountMinor = calculateDomainPrice(getTld(domain));
  const templateId = body.templateId === "elite-broker" || body.templateId === "volterra" ? body.templateId as keyof typeof origins : undefined;
  const templateSiteId = /^[a-f0-9]{24}$/.test(String(body.templateSiteId ?? "")) ? String(body.templateSiteId) : undefined; const now = new Date().toISOString();
  try {
    const debit = await purchaseWithWallet({ userId: caller.uid, authoritativeAmountMinor: amountMinor, reference, description: `Domain registration: ${domain}`, serviceType: "domain", serviceId: domain, metadata: { domain } });
    await saveDomainOrder({ id: `wallet_${reference}`, userId: caller.uid, domain, tld: getTld(domain), amountCents: amountMinor, currency: "NGN", paystackReference: reference, paymentStatus: "paid", registrationStatus: "payment_confirmed", registrarOrderId: null, idempotencyKey, refundState: "not_required", registrant, registrarTermsAcceptedAt: now, templateId, templateSiteId, templateSiteUrl: templateId && templateSiteId ? `${origins[templateId]}/site/${templateSiteId}` : undefined, createdAt: now, updatedAt: now });
    const order = await registerPaidDomain(reference, caller.uid, registrant);
    if (!["registered", "email_verification_pending", "email_ready"].includes(order.registrationStatus)) { await refundTransaction({ transactionId: debit.id, actorUserId: "system", reason: `Domain registration failed: ${order.errorMessage ?? "provider did not complete the order"}`, type: "reversal" }); await saveDomainOrder({ ...order, paymentStatus: "refunded", refundState: "completed", updatedAt: new Date().toISOString() }); return NextResponse.json({ error: "Registration did not complete. Your wallet debit was automatically reversed.", order }, { status: 502 }); }
    return NextResponse.json({ order, transaction: debit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet purchase failed.";
    return NextResponse.json({ error: message === "INSUFFICIENT_BALANCE" ? "Insufficient wallet balance. Add funds to continue." : message }, { status: message === "INSUFFICIENT_BALANCE" ? 402 : 400 });
  }
}
