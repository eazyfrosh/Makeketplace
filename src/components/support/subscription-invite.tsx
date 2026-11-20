"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Crown, X } from "lucide-react";
import { TELEGRAM_INVITE_ACTIVE_KEY } from "@/components/support/telegram-channel-invite";

const DISMISSED_UNTIL_KEY = "eazytool_subscription_invite_dismissed_until";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

function isPublicPage(pathname: string) {
  return pathname === "/" || /^\/(services|pricing|about|contact|domains|support-templates)(\/|$)/.test(pathname);
}

export function SubscriptionInvite() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const publicPage = isPublicPage(pathname);

  useEffect(() => {
    if (!publicPage || pathname === "/pricing") return;
    try {
      const dismissedUntil = Number(window.localStorage.getItem(DISMISSED_UNTIL_KEY));
      if (dismissedUntil > Date.now()) return;
    } catch {
      // The popup remains usable when browser storage is unavailable.
    }
    const timer = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(TELEGRAM_INVITE_ACTIVE_KEY) === "1") return;
      } catch {
        // Continue when browser storage is unavailable.
      }
      setVisible(true);
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [pathname, publicPage]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_FOR_MS));
    } catch {
      // Closing the invitation must still work if storage is blocked.
    }
  }

  if (!publicPage || pathname === "/pricing" || !visible) return null;

  return (
    <div className="fixed inset-0 z-[59] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm sm:p-8">
      <aside aria-label="Subscribe to EazyTool All Access" aria-modal="true" role="dialog" className="relative grid max-h-[min(90vh,700px)] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-primary/25 bg-card text-card-foreground shadow-2xl shadow-primary/30 md:grid-cols-[.95fr_1.05fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-cyan-600 px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-cyan-950/25 blur-3xl" />
          <div className="relative flex min-h-full flex-col justify-between gap-12">
            <div><span className="grid size-16 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/25 shadow-lg shadow-cyan-950/15"><Crown className="size-8" aria-hidden="true" /></span><p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">EazyTool All Access</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Unlock your workspace.</h2><p className="mt-4 max-w-sm text-base leading-7 text-white/90">One subscription gives you a simpler way to access the tools and templates you need for everyday digital work.</p></div>
            <p className="relative text-sm font-medium text-white/75">Choose the access period that works best for you.</p>
          </div>
        </div>
        <div className="relative flex flex-col justify-center p-6 sm:p-10">
          <button type="button" aria-label="Close subscription invitation" onClick={dismiss} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-6 sm:top-6"><X className="size-5" aria-hidden="true" /></button>
          <div className="pr-8"><p className="text-sm font-semibold text-primary">Simple access for your work</p><h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Get more from EazyTool.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Compare the plans and choose the option that matches how often you use the platform.</p></div>
          <ul className="mt-8 grid gap-4 text-sm text-muted-foreground"><li className="flex items-start gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/12"><Check className="size-4 text-emerald-500" /></span><span><strong className="font-semibold text-foreground">Access useful tools and templates</strong><br />Work from one familiar EazyTool workspace.</span></li><li className="flex items-start gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/12"><Check className="size-4 text-emerald-500" /></span><span><strong className="font-semibold text-foreground">Choose your access period</strong><br />Select monthly, 6-month, or yearly access.</span></li><li className="flex items-start gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/12"><Check className="size-4 text-emerald-500" /></span><span><strong className="font-semibold text-foreground">No automatic renewal</strong><br />Pay once for the access period you choose.</span></li></ul>
          <div className="mt-8 flex flex-col gap-3"><Link href="/pricing" onClick={dismiss} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View subscription plans <ArrowRight className="size-4" /></Link><button type="button" onClick={dismiss} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">Maybe later</button></div>
        </div>
      </aside>
    </div>
  );
}
