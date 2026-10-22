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

type ConsentChoice = "accepted" | "rejected" | null;
const settingsEvent = "eazytool:analytics-settings";

export function AnalyticsSettingsButton() {
  if (!ga4Configured()) return null;
  return <button type="button" className="hover:text-foreground" onClick={() => window.dispatchEvent(new Event(settingsEvent))}>Cookie settings</button>;
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [choice, setChoice] = React.useState<ConsentChoice | "loading">("loading");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const initialCampaign = React.useRef("");
  const lastPageView = React.useRef("");

  React.useEffect(() => {
    if (!ga4Configured()) return;
    initialCampaign.current = safeCampaignFromSearch(window.location.search);
    const saved = readAnalyticsConsent();
    if (saved === "accepted") setAnalyticsEnabled(true, initialCampaign.current);
    setChoice(saved);
    const openSettings = () => setSettingsOpen(true);
    const syncConsent = (event: StorageEvent) => {
      if (event.key && event.key !== analyticsConsentStorageKey) return;
      const updated = readAnalyticsConsent();
      setAnalyticsEnabled(updated === "accepted", initialCampaign.current);
      if (updated !== "accepted") lastPageView.current = "";
      setChoice(updated);
    };
    window.addEventListener(settingsEvent, openSettings);
    window.addEventListener("storage", syncConsent);
    return () => {
      window.removeEventListener(settingsEvent, openSettings);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  React.useEffect(() => {
    if (choice !== "accepted") return;
    const currentCampaign = safeCampaignFromSearch(search);
    const campaign = currentCampaign || (!lastPageView.current ? initialCampaign.current : "");
    // Keep the raw route only in memory so two different detail pages count as
    // separate views, even though both are sent to GA as /[item].
    const routeKey = `${pathname}?${search}`;
    if (lastPageView.current === routeKey) return;
    trackPageView(pathname, campaign);
    lastPageView.current = routeKey;
  }, [choice, pathname, search]);

  if (!ga4Configured()) return null;

  function select(next: Exclude<ConsentChoice, null>) {
    saveAnalyticsConsent(next);
    setAnalyticsEnabled(next === "accepted", initialCampaign.current);
    if (next === "rejected") lastPageView.current = "";
    setChoice(next);
    setSettingsOpen(false);
  }

  return <>
    {choice === "accepted" && <Script id="eazytool-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} strategy="afterInteractive" />}
    {(choice === null || settingsOpen) && <section role="dialog" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-2xl border bg-background p-5 shadow-2xl sm:bottom-6 sm:p-6">
      <h2 id="analytics-consent-title" className="text-lg font-semibold">Choose your analytics cookies</h2>
      <p id="analytics-consent-description" className="mt-2 text-sm leading-6 text-muted-foreground">With your permission, EazyTool uses Google Analytics to understand visits and which tools are useful. We do not send your name, email, payment details, or domain name. You can change this choice later in the footer. <Link href="/legal/privacy" className="font-medium text-primary underline underline-offset-2">Privacy details</Link></p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => select("rejected")}>Reject analytics</Button><Button type="button" onClick={() => select("accepted")}>Allow analytics</Button></div>
    </section>}
  </>;
}
