"use client";

import * as React from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  analyticsConsentStorageKey,
  ga4Configured,
  readAnalyticsConsent,
  safeCampaignFromSearch,
  saveAnalyticsConsent,
  setAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics/ga4";
import {
  activateTikTokPixel,
  marketingConsentStorageKey,
  readMarketingConsent,
  safeTikTokPage,
  saveMarketingConsent,
  setMarketingEnabled,
  tiktokBaseCode,
  tiktokConfigured,
  trackTikTokPageView,
} from "@/lib/analytics/tiktok";

type ConsentChoice = "accepted" | "rejected" | null;
const settingsEvent = "eazytool:analytics-settings";

export function AnalyticsSettingsButton() {
  if (!ga4Configured() && !tiktokConfigured()) return null;
  return <button type="button" className="hover:text-foreground" onClick={() => window.dispatchEvent(new Event(settingsEvent))}>Cookie settings</button>;
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [choice, setChoice] = React.useState<ConsentChoice | "loading">("loading");
  const [marketingChoice, setMarketingChoice] = React.useState<ConsentChoice | "loading">("loading");
  const [analyticsSelected, setAnalyticsSelected] = React.useState(false);
  const [marketingSelected, setMarketingSelected] = React.useState(false);
  const [scriptReady, setScriptReady] = React.useState(false);
  const [tiktokReady, setTiktokReady] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const initialCampaign = React.useRef("");
  const lastPageView = React.useRef("");

  React.useEffect(() => {
    if (!ga4Configured() && !tiktokConfigured()) return;
    initialCampaign.current = safeCampaignFromSearch(window.location.search);
    const saved = readAnalyticsConsent();
    const savedMarketing = readMarketingConsent();
    setAnalyticsEnabled(saved === "accepted", initialCampaign.current);
    setMarketingEnabled(savedMarketing === "accepted");
    setChoice(saved);
    setMarketingChoice(savedMarketing);
    setAnalyticsSelected(saved === "accepted");
    setMarketingSelected(savedMarketing === "accepted");
    const openSettings = () => setSettingsOpen(true);
    const syncConsent = (event: StorageEvent) => {
      if (event.key && event.key !== analyticsConsentStorageKey && event.key !== marketingConsentStorageKey) return;
      const updated = readAnalyticsConsent();
      const updatedMarketing = readMarketingConsent();
      setAnalyticsEnabled(updated === "accepted", initialCampaign.current);
      setMarketingEnabled(updatedMarketing === "accepted");
      if (updatedMarketing === "accepted") activateTikTokPixel(() => setTiktokReady(true));
      if (updated !== "accepted") {
        lastPageView.current = "";
        setScriptReady(false);
      }
      if (updatedMarketing !== "accepted") setTiktokReady(false);
      setChoice(updated);
      setMarketingChoice(updatedMarketing);
      setAnalyticsSelected(updated === "accepted");
      setMarketingSelected(updatedMarketing === "accepted");
    };
    window.addEventListener(settingsEvent, openSettings);
    window.addEventListener("storage", syncConsent);
    return () => {
      window.removeEventListener(settingsEvent, openSettings);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  React.useEffect(() => {
    if (choice !== "accepted" || !scriptReady) return;
    const currentCampaign = safeCampaignFromSearch(search);
    const campaign = currentCampaign || (!lastPageView.current ? initialCampaign.current : "");
    // Keep the raw route only in memory so two different detail pages count as
    // separate views, even though both are sent to GA as /[item].
    const routeKey = `${pathname}?${search}`;
    if (lastPageView.current === routeKey) return;
    trackPageView(pathname, campaign);
    lastPageView.current = routeKey;
  }, [choice, pathname, search, scriptReady]);

  React.useEffect(() => {
    if (marketingChoice !== "accepted" || !tiktokReady) return;
    trackTikTokPageView(pathname, search);
  }, [marketingChoice, pathname, search, tiktokReady]);

  if (!ga4Configured() && !tiktokConfigured()) return null;

  function select(allowAnalytics: boolean, allowMarketing: boolean) {
    const next = allowAnalytics && ga4Configured() ? "accepted" : "rejected";
    const nextMarketing = allowMarketing && tiktokConfigured() ? "accepted" : "rejected";
    if (ga4Configured()) saveAnalyticsConsent(next);
    if (tiktokConfigured()) saveMarketingConsent(nextMarketing);
    setAnalyticsEnabled(next === "accepted", initialCampaign.current);
    setMarketingEnabled(nextMarketing === "accepted");
    if (nextMarketing === "accepted") activateTikTokPixel(() => setTiktokReady(true));
    if (next !== "accepted") {
      lastPageView.current = "";
      setScriptReady(false);
    }
    if (nextMarketing !== "accepted") setTiktokReady(false);
    setChoice(next);
    setMarketingChoice(nextMarketing);
    setAnalyticsSelected(next === "accepted");
    setMarketingSelected(nextMarketing === "accepted");
    setSettingsOpen(false);
  }

  const needsChoice = choice !== "loading" && marketingChoice !== "loading" &&
    ((ga4Configured() && choice === null) || (tiktokConfigured() && marketingChoice === null));
  const pixelAllowed = tiktokConfigured() && marketingChoice === "accepted" && safeTikTokPage(pathname, search);

  return <>
    {choice === "accepted" && <Script id="eazytool-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setScriptReady(false)} />}
    {pixelAllowed && <Script id="eazytool-tiktok-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: tiktokBaseCode() }} onReady={() => { window.setTimeout(() => activateTikTokPixel(() => setTiktokReady(true)), 0); }} />}
    {(needsChoice || settingsOpen) && <section role="dialog" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-2xl border bg-background p-5 shadow-2xl sm:bottom-6 sm:p-6">
      <h2 id="analytics-consent-title" className="text-lg font-semibold">Choose optional cookies</h2>
      <p id="analytics-consent-description" className="mt-2 text-sm leading-6 text-muted-foreground">Choose how EazyTool may measure visits and advertising results. Your account works without either option. You can change your choices later in the footer. <Link href="/legal/privacy" className="font-medium text-primary underline underline-offset-2">Privacy details</Link></p>
      <div className="mt-4 space-y-3">
        {ga4Configured() && <label className="flex items-start gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={analyticsSelected} onChange={(event) => setAnalyticsSelected(event.target.checked)} className="mt-1 size-4" /><span><strong className="block">Analytics</strong><span className="text-muted-foreground">Google Analytics helps us understand visits and tool usage.</span></span></label>}
        {tiktokConfigured() && <label className="flex items-start gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={marketingSelected} onChange={(event) => setMarketingSelected(event.target.checked)} className="mt-1 size-4" /><span><strong className="block">Marketing</strong><span className="text-muted-foreground">TikTok Pixel measures public page visits, registrations, and verified subscription purchases for ads.</span></span></label>}
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => select(false, false)}>Reject optional cookies</Button><Button type="button" onClick={() => select(analyticsSelected, marketingSelected)}>Save choices</Button></div>
    </section>}
  </>;
}
