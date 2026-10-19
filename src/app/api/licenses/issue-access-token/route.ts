import { NextResponse } from "next/server";

import { getServiceBySlug } from "@/lib/data/services";
import { signAccessToken } from "@/lib/licensing/jwt";
import { resolveServiceAccess } from "@/lib/licensing/service-access";
import { verifyCaller } from "@/lib/licensing/verify-auth";

/**
 * Called when a customer clicks "Access" in their dashboard. Confirms they
 * hold an active, unexpired subscription for the service, then mints a short-lived
 * signed token the external service will independently validate — the
 * marketplace UI is never trusted on its own.
 */
export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const serviceSlug = body?.serviceSlug as string | undefined;
  const templateId = body?.templateId;
  const destination = body?.destination === "editor" || body?.destination === "preview" ? body.destination : "admin";
  if (!serviceSlug) {
    return NextResponse.json({ error: "Missing serviceSlug." }, { status: 400 });
  }

  const service = getServiceBySlug(serviceSlug);
  if (!service) {
    return NextResponse.json({ error: "Unknown service." }, { status: 404 });
  }
  const premiumTemplateIds = new Set(["elite-broker", "volterra", "novabank-dashboard", "swiftstream-cargo", "tradeflow"]);
  if (serviceSlug === "premium-templates" && !premiumTemplateIds.has(templateId)) {
    return NextResponse.json({ error: "Unknown website design." }, { status: 400 });
  }

  const access = await resolveServiceAccess(caller.uid, caller.role, serviceSlug);
  if (!access.allowed || !access.entitlementId) return NextResponse.json({ error: "An active subscription or service license is required." }, { status: 403 });

  const token = await signAccessToken({ sub: caller.uid, serviceId: serviceSlug, licenseId: access.entitlementId });

  // SwiftStream customers are provisioned into a separate owner workspace;
  // the original deployment's /admin operator console remains isolated.
  if (serviceSlug === "premium-templates" && templateId === "swiftstream-cargo") {
    const swiftstreamOrigin = process.env.SWIFTSTREAM_CARGO_APP_ORIGIN?.replace(/\/$/, "") ?? "https://swiftstreamcargo.vercel.app";
    const accessUrl = new URL(`${swiftstreamOrigin}/api/eazytools/sso`);
    accessUrl.searchParams.set("token", token);
    accessUrl.searchParams.set("template", templateId);
    accessUrl.searchParams.set("destination", destination);
    return NextResponse.json({ redirectUrl: accessUrl.toString() });
  }

  if (serviceSlug === "premium-templates" && templateId === "novabank-dashboard") {
    const novaBankOrigin = process.env.NOVABANK_TEMPLATE_APP_ORIGIN?.replace(/\/$/, "") ?? "https://novabank-dashboard.vercel.app";
    const accessUrl = new URL(`${novaBankOrigin}/api/eazytools/sso`);
    accessUrl.searchParams.set("token", token);
    accessUrl.searchParams.set("template", templateId);
    accessUrl.searchParams.set("destination", destination);
    return NextResponse.json({ redirectUrl: accessUrl.toString() });
  }

  if (serviceSlug === "premium-templates" && templateId === "tradeflow") {
    const tradeFlowOrigin = process.env.TRADING_PLATFORM_APP_ORIGIN?.replace(/\/$/, "") ?? "https://trading-platform-phi-hazel.vercel.app";
    const accessUrl = new URL(`${tradeFlowOrigin}/api/eazytools/sso`);
    accessUrl.searchParams.set("token", token);
    accessUrl.searchParams.set("template", templateId);
    accessUrl.searchParams.set("destination", destination);
    return NextResponse.json({ redirectUrl: accessUrl.toString() });
  }

  // Only the explicitly trusted Volterra deployment may receive marketplace
  // access tokens. Other external service URLs keep their legacy direct-link
  // behavior so a database value can never become a token exfiltration target.
  if (/^https?:\/\//i.test(service.accessUrl)) {
    const eliteOrigin = process.env.ELITE_BROKER_APP_ORIGIN?.replace(/\/$/, "") ?? "https://premium-broker-platform.vercel.app";
    const targetUrl = serviceSlug === "premium-templates" && templateId === "elite-broker" ? `${eliteOrigin}/api/eazytools/sso` : service.accessUrl;
    const accessUrl = new URL(targetUrl);
    const configuredOrigin = process.env.VOLTERRA_APP_ORIGIN?.replace(/\/$/, "");
    const trustedOrigins = new Set([
      "https://tesla-blush-nine.vercel.app",
      "https://premium-broker-platform.vercel.app",
      ...(configuredOrigin ? [configuredOrigin] : []),
      ...(process.env.ELITE_BROKER_APP_ORIGIN ? [eliteOrigin] : []),
    ]);
    if (serviceSlug === "premium-templates" && trustedOrigins.has(accessUrl.origin)) {
      accessUrl.searchParams.set("token", token);
      accessUrl.searchParams.set("template", templateId);
      accessUrl.searchParams.set("destination", destination);
      return NextResponse.json({ redirectUrl: accessUrl.toString() });
    }
    return NextResponse.json({ redirectUrl: service.accessUrl });
  }

  const separator = service.accessUrl.includes("?") ? "&" : "?";

  return NextResponse.json({ redirectUrl: `${service.accessUrl}${separator}token=${token}` });
}
