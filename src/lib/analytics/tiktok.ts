"use client";

const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "";
const privacyReviewed = process.env.NEXT_PUBLIC_TIKTOK_PRIVACY_REVIEWED === "true";
export const marketingConsentStorageKey = "eazytool_marketing_consent_v1";
const conversionKeyPrefix = "eazytool_tiktok_purchase_v1:";

type ConsentChoice = "accepted" | "rejected" | null;
type TikTokQueue = {
  page: () => void;
  track: (event: string, parameters?: Record<string, string | number>) => void;
  ready: (callback: () => void) => void;
  grantConsent: () => void;
  revokeConsent: () => void;
};
type TikTokWindow = Window & { ttq?: TikTokQueue };

let marketingGranted = false;
let pixelReady = false;
let lastPageKey = "";
const pendingEvents: Array<() => void> = [];
const sentPurchases = new Set<string>();

// TikTok's SDK reads the browser URL itself. Never load or fire it on a route
// that may contain a customer's account, payment reference, or custom domain.
const publicPaths = new Set([
  "/", "/about", "/contact", "/pricing", "/services",
  "/auth/signup", "/subscription/confirmed",
]);
const publicServiceSlugs = new Set([
  "airline-booking-platform", "banking-platform", "email-designer",
  "logistics-platform", "premium-templates", "qr-code-generator",
  "receipt-generator", "support-website-templates",
]);

export function tiktokConfigured() {
  return privacyReviewed && /^[A-Z0-9]{20}$/.test(pixelId);
}

export function readMarketingConsent(): ConsentChoice {
  try {
    const saved = window.localStorage.getItem(marketingConsentStorageKey);
    return saved === "accepted" || saved === "rejected" ? saved : null;
  } catch {
    return null;
  }
}

export function saveMarketingConsent(choice: Exclude<ConsentChoice, null>) {
  try { window.localStorage.setItem(marketingConsentStorageKey, choice); } catch { /* In-memory choice remains valid for this visit. */ }
}

export function safeTikTokPage(pathname: string, search: string) {
  if (!publicPaths.has(pathname)) {
    const match = /^\/services\/([a-z-]+)$/.exec(pathname);
    if (!match || !publicServiceSlugs.has(match[1])) return false;
  }
  const query = new URLSearchParams(search);
  for (const [key, value] of query) {
    if (key === "utm_source" && ["tiktok", "snapchat", "instagram", "facebook", "google"].includes(value.toLowerCase())) continue;
    if (key === "utm_medium" && ["social", "paid_social", "cpc", "organic", "referral"].includes(value.toLowerCase())) continue;
    if (key === "ttclid" && /^[A-Za-z0-9._-]{1,512}$/.test(value)) continue;
    return false;
  }
  return true;
}

function currentPageIsSafe() {
  return safeTikTokPage(window.location.pathname, window.location.search);
}

function clearTikTokCookies() {
  const host = window.location.hostname;
  const parent = host.split(".").slice(-2).join(".");
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (!/^_ttp$|^_tt_enable_cookie$|^ttcsid(?:_|$)|^ttclid$/.test(name)) continue;
    for (const domain of ["", host, parent]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export function setMarketingEnabled(enabled: boolean) {
  marketingGranted = tiktokConfigured() && enabled;
  if (marketingGranted) {
    if (pixelReady) (window as TikTokWindow).ttq?.grantConsent();
  } else {
    (window as TikTokWindow).ttq?.revokeConsent();
    lastPageKey = "";
    pendingEvents.length = 0;
    clearTikTokCookies();
  }
}

export function markTikTokReady() {
  if (!marketingGranted || !currentPageIsSafe()) return;
  pixelReady = true;
  (window as TikTokWindow).ttq?.grantConsent();
  trackTikTokPageView(window.location.pathname, window.location.search);
}

export function activateTikTokPixel(onReady: () => void) {
  const queue = (window as TikTokWindow).ttq;
  if (!queue || !marketingGranted) return;
  queue.grantConsent();
  queue.ready(() => {
    markTikTokReady();
    onReady();
  });
}

export function trackTikTokPageView(pathname: string, search: string) {
  if (!safeTikTokPage(pathname, search)) {
    lastPageKey = "";
    return false;
  }
  if (!marketingGranted || !pixelReady) return false;
  const key = `${pathname}?${search}`;
  const isNewPage = lastPageKey !== key;
  if (isNewPage) {
    (window as TikTokWindow).ttq?.page();
    lastPageKey = key;
  }
  for (const event of pendingEvents.splice(0)) event();
  return isNewPage;
}

export function trackTikTokRegistration() {
  if (!marketingGranted || !currentPageIsSafe()) return false;
  const send = () => (window as TikTokWindow).ttq?.track("CompleteRegistration");
  if (pixelReady) send();
  else pendingEvents.push(send);
  return true;
}

function referenceHash(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}

export function trackTikTokPurchase(reference: string, amountMinor: number, currency: string) {
  if (!marketingGranted || !reference || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || currency !== "NGN") return false;
  const key = `${conversionKeyPrefix}${referenceHash(reference)}`;
  if (sentPurchases.has(key)) return false;
  try { if (window.localStorage.getItem(key)) return false; } catch { /* The in-memory set still deduplicates this visit. */ }
  const send = () => {
    if (!marketingGranted || !currentPageIsSafe() || sentPurchases.has(key)) return;
    (window as TikTokWindow).ttq?.track("Purchase", { value: amountMinor / 100, currency: "NGN" });
    sentPurchases.add(key);
    try { window.localStorage.setItem(key, "1"); } catch { /* Browser storage may be unavailable. */ }
  };
  if (pixelReady && currentPageIsSafe()) send();
  else pendingEvents.push(send);
  return true;
}

// TikTok's official queue, with SPA auto-pageviews disabled so this app sends
// exactly one manually controlled pageview on approved public routes.
export function tiktokBaseCode() {
  if (!tiktokConfigured()) return "";
  return `!function(w,d,t){w.TiktokAnalyticsObject=t;var q=w[t]=w[t]||[];q.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];q.setAndDefer=function(o,m){o[m]=function(){o.push([m].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<q.methods.length;i++)q.setAndDefer(q,q.methods[i]);q.instance=function(e){for(var a=q._i[e]||[],n=0;n<q.methods.length;n++)q.setAndDefer(a,q.methods[n]);return a};q.load=function(e,o){var u="https://analytics.tiktok.com/i18n/pixel/events.js";q._i=q._i||{};q._i[e]=[];q._i[e]._u=u;q._t=q._t||{};q._t[e]=+new Date;q._o=q._o||{};q._o[e]=o||{};var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src=u+"?sdkid="+e+"&lib="+t;var f=d.getElementsByTagName("script")[0];f.parentNode.insertBefore(s,f)};q.holdConsent();q.load("${pixelId}",{historyObserver:false})}(window,document,"ttq");`;
}
