"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BellRing, Send, X } from "lucide-react";

const CHANNEL_URL = "https://t.me/eazy_tool";
const DISMISSED_UNTIL_KEY = "eazytool_telegram_channel_dismissed_until";
export const TELEGRAM_INVITE_ACTIVE_KEY = "eazytool_telegram_channel_invite_active";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

function isPublicPage(pathname: string) {
  return pathname === "/" || /^\/(services|pricing|about|contact|domains|support-templates)(\/|$)/.test(pathname);
}

export function TelegramChannelInvite() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const publicPage = isPublicPage(pathname);

  useEffect(() => {
    if (!publicPage) return;
    try {
      const dismissedUntil = Number(window.localStorage.getItem(DISMISSED_UNTIL_KEY));
      if (dismissedUntil > Date.now()) return;
    } catch {
      // Storage can be unavailable in private browsing; the invite still works.
    }
    const timer = window.setTimeout(() => {
      setVisible(true);
      try { window.localStorage.setItem(TELEGRAM_INVITE_ACTIVE_KEY, "1"); } catch { /* no-op */ }
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [publicPage, pathname]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_FOR_MS));
      window.localStorage.removeItem(TELEGRAM_INVITE_ACTIVE_KEY);
    } catch {
      // Closing the invite must still work if storage is blocked.
    }
  }

  if (!publicPage || !visible) return null;

  return (
    <aside
      aria-label="Join the EazyTool Telegram channel"
      className="fixed inset-x-4 bottom-24 z-[60] mx-auto w-auto max-w-md overflow-hidden rounded-3xl border border-sky-400/30 bg-card text-card-foreground shadow-2xl shadow-sky-950/25 sm:right-6 sm:bottom-6 sm:left-auto"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-[#229ED9] to-[#147eb1] px-5 pb-5 pt-6 text-white sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-white/15 blur-2xl" />
        <button
          type="button"
          aria-label="Close Telegram invitation"
          onClick={dismiss}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <div className="relative flex items-center gap-3 pr-8">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Send className="size-5 -translate-x-0.5" aria-hidden="true" /></span>
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">EazyTool community</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Stay in the loop</h2></div>
        </div>
        <p className="relative mt-4 text-sm leading-6 text-white/90">Join our Telegram channel for product updates, helpful tips, service announcements, and launch news.</p>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3.5"><BellRing className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-300" /><p className="text-sm leading-5 text-muted-foreground">Free to join. You can leave whenever you want.</p></div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#168ac2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">Join Telegram channel <ArrowUpRight className="size-4" aria-hidden="true" /></a>
          <button type="button" onClick={dismiss} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">Maybe later</button>
        </div>
      </div>
    </aside>
  );
}
