import { DomainProviderError, domainServiceUnavailableMessage, requireDomainProvider } from "@/lib/domains/provider";
import { resellerClubDomainProvider } from "@/lib/domains/resellerclub-provider";
import { claimDomainRegistration, getDomainForUser, getDomainOrder, getDomainOrderByReference, saveDomain, saveDomainOrder } from "@/lib/domains/store";
import { provisionEmailDomain } from "@/lib/email-domains/provisioning";
import { getTld, type DomainRecord, type Registrant } from "@/types/domains";

export async function registerPaidDomain(reference: string, userId: string, registrant: Registrant) {
  const order = await getDomainOrderByReference(reference);
  if (!order || order.userId !== userId) throw new Error("Domain order not found.");
  if (order.registrationStatus === "registered" || order.registrationStatus === "email_ready") return order;
  if (await getDomainForUser(order.domain, userId)) return order;
  const now = new Date().toISOString();
  let provider;
  try { provider = requireDomainProvider(resellerClubDomainProvider); }
  catch {
    const unavailable = { ...order, paymentStatus: "admin_review" as const, registrationStatus: "failed" as const, refundState: "admin_review" as const, errorMessage: domainServiceUnavailableMessage, updatedAt: now };
    await saveDomainOrder(unavailable);
    return unavailable;
  }
  if (!(await claimDomainRegistration(order.id, userId))) return await getDomainOrder(order.id) ?? order;
  const pending = { ...order, paymentStatus: "paid" as const, registrationStatus: "registration_pending" as const, updatedAt: now };
  await saveDomainOrder(pending);
  try {
    const available = await provider.searchAvailability(order.domain);
    if (!available.available) throw new DomainProviderError("DOMAIN_UNAVAILABLE", "Domain became unavailable before registration.");
    const buyer = await provider.ensureBuyerAccount({ userId, registrant });
    const response = await provider.registerDomain({ domain: order.domain, years: 1, registrant, buyer, idempotencyKey: order.idempotencyKey ?? order.id });
    const expiry = response.expiresAt || (() => { const value = new Date(); value.setFullYear(value.getFullYear() + 1); return value.toISOString(); })();
    const domain: DomainRecord = { id: `domain_${order.id}`, userId, domain: order.domain, tld: getTld(order.domain), registrar: "resellerclub", registrarOrderId: response.providerDomainId, providerDomainId: response.providerDomainId, status: "active", registrationStatus: "registered", dnsStatus: "not_started", emailVerificationStatus: "not_started", registeredAt: response.registeredAt ?? now, expiresAt: expiry, autoRenew: false, renewalStatus: "manual", nameservers: await provider.getNameservers(response.providerDomainId).catch(() => []), customerPriceCents: order.amountCents, purchasePriceMinor: order.amountCents, paymentReference: reference, currency: "NGN", registrant, templateId: order.templateId, templateSiteId: order.templateSiteId, templateSiteUrl: order.templateSiteUrl, provisioningErrors: [], createdAt: now, updatedAt: now };
    await saveDomain(domain);
    const done = { ...pending, registrationStatus: "registered" as const, registrarOrderId: response.providerDomainId, providerDomainId: response.providerDomainId, refundState: "not_required" as const, updatedAt: new Date().toISOString() };
    await saveDomainOrder(done);
    if (process.env.RESEND_API_KEY && process.env.RESEND_WEBHOOK_SECRET) {
      try { const emailDomain = await provisionEmailDomain(domain); await saveDomain({ ...domain, registrationStatus: emailDomain.status === "ready" ? "email_ready" : "email_verification_pending", dnsStatus: emailDomain.dnsConfiguredAt ? "configured" : "pending", emailVerificationStatus: emailDomain.status === "ready" ? "verified" : "pending", updatedAt: new Date().toISOString() }); }
      catch (error) { await saveDomain({ ...domain, dnsStatus: "failed", emailVerificationStatus: "failed", provisioningErrors: [{ code: "EMAIL_PROVISIONING_FAILED", message: error instanceof Error ? error.message : "Email setup failed.", occurredAt: new Date().toISOString() }], updatedAt: new Date().toISOString() }); }
    }
    return done;
  } catch (error) {
    if (error instanceof DomainProviderError && error.code === "PROVIDER_NOT_CONFIGURED") throw new DomainProviderError("PROVIDER_NOT_CONFIGURED", domainServiceUnavailableMessage);
    const message = error instanceof Error ? error.message : "Registrar registration failed.";
    const failed = { ...pending, registrationStatus: "failed" as const, refundState: "admin_review" as const, paymentStatus: "admin_review" as const, errorMessage: message, updatedAt: new Date().toISOString() };
    await saveDomainOrder(failed);
    return failed;
  }
}
