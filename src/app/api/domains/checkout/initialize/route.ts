import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { calculateDomainPrice } from "@/lib/domain-pricing";
import { checkAvailability, isResellerClubConfigured } from "@/lib/resellerclub";
import { getTld, isValidDomain, normalizeDomain } from "@/types/domains";
import { saveDomainOrder } from "@/lib/domains/store";
import { generateId } from "@/lib/licensing/keys";

const secret = process.env.PAYSTACK_SECRET_KEY;
const origins = { "elite-broker": "https://premium-broker-platform.vercel.app", volterra: "https://tesla-blush-nine.vercel.app" } as const;

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in to buy a domain." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const domain = normalizeDomain(String(body.domain ?? ""));
  if (!isValidDomain(domain)) return NextResponse.json({ error: "Enter a valid domain name." }, { status: 400 });
  if (isResellerClubConfigured() && !(await checkAvailability(domain))) return NextResponse.json({ error: "That domain is no longer available." }, { status: 409 });
  const templateId = body.templateId === "elite-broker" || body.templateId === "volterra" ? body.templateId as keyof typeof origins : undefined;
  const templateSiteId = /^[a-f0-9]{24}$/.test(String(body.templateSiteId ?? "")) ? String(body.templateSiteId) : undefined;
  const templateSiteUrl = templateId && templateSiteId ? `${origins[templateId]}/site/${templateSiteId}` : undefined;
  const amountCents = calculateDomainPrice(getTld(domain));
  const orderId = generateId("dorder");
  const reference = `${orderId}_${Date.now()}`;
  const now = new Date().toISOString();
  await saveDomainOrder({ id: orderId, userId: caller.uid, domain, tld: getTld(domain), amountCents, currency: "NGN", paystackReference: reference, paymentStatus: "pending", registrationStatus: "pending", registrarOrderId: null, templateId, templateSiteId, templateSiteUrl, createdAt: now, updatedAt: now });
  if (!secret) return NextResponse.json({ demo: true, orderId, reference, amountCents, message: "Paystack is not configured. Set PAYSTACK_SECRET_KEY to enable live checkout." });
  const callback = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/domains/success?reference=${encodeURIComponent(reference)}`;
  const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: caller.email, amount: amountCents, currency: "NGN", reference, callback_url: callback, metadata: { orderId, userId: caller.uid, domain, templateId, templateSiteId } }) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.data?.authorization_url) return NextResponse.json({ error: "Unable to start Paystack checkout." }, { status: 502 });
  return NextResponse.json({ demo: false, orderId, reference, amountCents, authorizationUrl: data.data.authorization_url });
}
