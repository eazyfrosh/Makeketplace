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
    <aside
      aria-label="Subscribe to EazyTool All Access"
      className="fixed inset-x-4 bottom-24 z-[59] mx-auto w-auto max-w-md overflow-hidden rounded-3xl border border-primary/25 bg-card text-card-foreground shadow-2xl shadow-primary/20 sm:right-6 sm:bottom-6 sm:left-auto"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-cyan-600 px-5 pb-5 pt-6 text-primary-foreground sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-white/15 blur-2xl" />
        <button
          type="button"
          aria-label="Close subscription invitation"
          onClick={dismiss}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <div className="relative flex items-center gap-3 pr-8">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Crown className="size-5" aria-hidden="true" /></span>
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">EazyTool All Access</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Unlock every tool</h2></div>
        </div>
        <p className="relative mt-4 text-sm leading-6 text-white/85">Subscribe once and use available websites, email tools, domains, business platforms, and templates in one simple workspace.</p>
      </div>
      <div className="p-5 sm:p-6">
        <ul className="grid gap-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" />Access the available tools and templates</li>
          <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" />Choose monthly, 6-month, or yearly access</li>
          <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" />Pay once — no automatic renewal</li>
        </ul>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Link href="/pricing" onClick={dismiss} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View subscription plans <ArrowRight className="size-4" /></Link>
          <button type="button" onClick={dismiss} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">Maybe later</button>
        </div>
      </div>
    </aside>
  );
}
