"use client";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const analyticsConsentStorageKey = "eazytool_analytics_consent_v1";
const conversionKeyPrefix = "eazytool_ga4_conversion_v1:";

type ConsentChoice = "accepted" | "rejected" | null;
type Gtag = (...args: unknown[]) => void;
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Gtag;
};

let consentGranted = false;
let tagConfigured = false;
let previousPageLocation: string | null = null;
const sentConversions = new Set<string>();

const safeSegments = new Set([
  "about", "admin", "affiliates", "airline-booking-platform", "ai-automation", "auth",
  "banking-platform", "billing", "booking", "callback", "cards", "checkout", "contact",
  "dashboard", "deals", "domains", "editor", "email-designer", "email-domains", "extras",
  "help", "legal", "licenses", "login", "logistics-platform", "orders", "platform",
  "premium-templates", "pricing", "privacy", "profile", "qr-code-generator", "receipt-generator",
  "services", "settings", "signup", "sms", "subscription", "subscriptions", "success",
  "support-templates", "templates", "terms", "track-shipment", "transactions", "trips",
  "verify-boarding-pass", "wallet", "wishlist", "website-builder",
]);
const campaignSources = new Set(["snapchat", "instagram", "facebook", "google"]);
const campaignMediums = new Set(["social", "paid_social", "cpc", "organic", "referral"]);
const serviceSlugs = new Set([
  "airline-booking-platform", "banking-platform", "email-designer", "logistics-platform",
  "premium-templates", "qr-code-generator", "receipt-generator", "support-website-templates",
]);

export function ga4Configured() {
  return /^G-[A-Z0-9]+$/.test(measurementId);
}

export function readAnalyticsConsent(): ConsentChoice {
  try {
    const saved = window.localStorage.getItem(analyticsConsentStorageKey);
    return saved === "accepted" || saved === "rejected" ? saved : null;
  } catch {
    return null;
  }
}

export function saveAnalyticsConsent(choice: Exclude<ConsentChoice, null>) {
  try {
    window.localStorage.setItem(analyticsConsentStorageKey, choice);
  } catch {
    // The choice still applies for this page when browser storage is unavailable.
  }
}

export function safeCampaignFromSearch(search: string): string {
  const input = new URLSearchParams(search);
  const source = input.get("utm_source")?.toLowerCase();
  if (!source || !campaignSources.has(source)) return "";
  const safe = new URLSearchParams({ utm_source: source });
  const medium = input.get("utm_medium")?.toLowerCase();
  if (medium && campaignMediums.has(medium)) safe.set("utm_medium", medium);
  return safe.toString();
}

export function safePageLocation(pathname: string, campaign = ""): string {
  const path = pathname.split("/").filter(Boolean).map((segment) => safeSegments.has(segment) ? segment : "[item]").join("/");
  const safeCampaign = safeCampaignFromSearch(`?${campaign}`);
  return `${window.location.origin}/${path}${safeCampaign ? `?${safeCampaign}` : ""}`;
}

function safeReferrer() {
  try {
    const referrer = new URL(document.referrer);
    return ["http:", "https:"].includes(referrer.protocol) ? `${referrer.origin}/` : "";
  } catch {
    return "";
  }
}

function pageContext(campaign = "") {
  const pathname = window.location.pathname;
  const location = safePageLocation(pathname, campaign);
  const section = pathname.split("/").filter(Boolean).map((part) => safeSegments.has(part) ? part : "item").at(-1) ?? "home";
  return { page_location: location, page_referrer: safeReferrer(), page_title: `EazyTool | ${section}` };
}

function analyticsWindow(): AnalyticsWindow {
  return window as AnalyticsWindow;
}

export function configureAnalytics(campaign = "") {
  if (!ga4Configured() || tagConfigured) return;
  const browser = analyticsWindow();
  browser.dataLayer = browser.dataLayer ?? [];
  browser.gtag = browser.gtag ?? ((...args: unknown[]) => { browser.dataLayer?.push(args); });
  (browser as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = false;
  browser.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  browser.gtag("js", new Date());
  browser.gtag("config", measurementId, {
    ...pageContext(campaign),
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  tagConfigured = true;
}

function removeAnalyticsCookies() {
  const host = window.location.hostname;
  const parent = host.split(".").slice(-2).join(".");
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue;
    for (const domain of ["", host, parent]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export function setAnalyticsEnabled(enabled: boolean, campaign = "") {
  if (!ga4Configured()) return;
  consentGranted = enabled;
  const browser = analyticsWindow();
  (browser as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = !enabled;
  if (enabled) {
    configureAnalytics(campaign);
    if (tagConfigured) browser.gtag?.("consent", "update", { analytics_storage: "granted" });
  } else {
    if (tagConfigured) browser.gtag?.("consent", "update", { analytics_storage: "denied" });
    previousPageLocation = null;
    removeAnalyticsCookies();
  }
}

export function trackPageView(pathname: string, campaign = "") {
  if (!consentGranted || !tagConfigured) return;
  const context = pageContext(campaign);
  context.page_location = safePageLocation(pathname, campaign);
  context.page_referrer = previousPageLocation ?? context.page_referrer;
  analyticsWindow().gtag?.("set", context);
  analyticsWindow().gtag?.("event", "page_view", context);
  previousPageLocation = context.page_location;
}

function track(name: string, parameters: Record<string, string> = {}) {
  if (!consentGranted || !tagConfigured) return false;
  analyticsWindow().gtag?.("event", name, { ...pageContext(safeCampaignFromSearch(window.location.search)), ...parameters });
  return true;
}

function referenceHash(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}

function trackConversionOnce(name: string, reference: string, parameters: Record<string, string>) {
  if (!reference || !consentGranted) return;
  const key = `${conversionKeyPrefix}${name}:${referenceHash(reference)}`;
  if (sentConversions.has(key)) return;
  try {
    if (window.localStorage.getItem(key)) return;
  } catch {
    // The in-memory set still prevents duplicate events within this page.
  }
  if (!track(name, parameters)) return;
  sentConversions.add(key);
  try { window.localStorage.setItem(key, "1"); } catch { /* Storage may be unavailable. */ }
}

export function trackRegistration() { track("sign_up", { method: "password" }); }
export function trackLogin() { track("login", { method: "password" }); }
export function trackSubscriptionSelection(planId: string) {
  track("subscription_plan_selected", { plan_id: /^[a-z0-9_-]{1,48}$/i.test(planId) ? planId : "custom" });
}
export function trackSubscriptionPurchase(reference: string, planId: string) {
  trackConversionOnce("subscription_purchase", reference, { plan_id: /^[a-z0-9_-]{1,48}$/i.test(planId) ? planId : "custom" });
}
export function trackServiceUsage(serviceSlug: string) {
  if (serviceSlugs.has(serviceSlug)) track("service_used", { service: serviceSlug });
}
export function trackDomainPurchase(reference: string, tld: string) {
  trackConversionOnce("domain_purchase", reference, { extension: /^[a-z]{2,12}$/.test(tld) ? tld : "other" });
}
