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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm sm:p-8">
      <aside aria-label="Join the EazyTool Telegram channel" aria-modal="true" role="dialog" className="relative grid max-h-[min(90vh,680px)] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-sky-400/30 bg-card text-card-foreground shadow-2xl shadow-sky-950/40 md:grid-cols-[.95fr_1.05fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#229ED9] via-[#1b91c9] to-[#126e9d] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-sky-950/25 blur-3xl" />
          <div className="relative flex min-h-full flex-col justify-between gap-12">
            <div><span className="grid size-16 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/25 shadow-lg shadow-sky-950/15"><Send className="size-8 -translate-x-0.5" aria-hidden="true" /></span><p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">EazyTool community</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Stay in the loop.</h2><p className="mt-4 max-w-sm text-base leading-7 text-white/90">Get the latest EazyTool updates, useful tips, service announcements, and launch news in one friendly channel.</p></div>
            <p className="relative text-sm font-medium text-white/75">A simple way to hear what is new at EazyTool.</p>
          </div>
        </div>
        <div className="relative flex flex-col justify-center p-6 sm:p-10">
          <button type="button" aria-label="Close Telegram invitation" onClick={dismiss} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-6 sm:top-6"><X className="size-5" aria-hidden="true" /></button>
          <div className="pr-8"><p className="text-sm font-semibold text-primary">Join for free</p><h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Useful updates, without the noise.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Join when you are ready. You can leave the channel whenever you want.</p></div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-sky-500/15 bg-sky-500/[0.08] p-4"><BellRing className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-300" /><p className="text-sm leading-6 text-muted-foreground">Be the first to hear about new tools, helpful tutorials, and important platform news.</p></div>
          <div className="mt-8 flex flex-col gap-3"><a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-[#168ac2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">Join Telegram channel <ArrowUpRight className="size-4" aria-hidden="true" /></a><button type="button" onClick={dismiss} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">Maybe later</button></div>
        </div>
      </aside>
    </div>
  );
}
