"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Send, X } from "lucide-react";

const CHANNEL_URL = "https://t.me/eazy_tool";
const DISMISSED_UNTIL_KEY = "eazytool_telegram_channel_dismissed_until";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

export function TelegramChannelInvite() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const publicPage = pathname === "/" || /^\/(services|pricing|about|contact)(\/|$)/.test(pathname);

  useEffect(() => {
    if (!publicPage) return;

    try {
      const dismissedUntil = Number(window.localStorage.getItem(DISMISSED_UNTIL_KEY));
      if (dismissedUntil > Date.now()) return;
    } catch {
      // Storage can be unavailable in private browsing; the invite still works.
    }

    const timer = window.setTimeout(() => setVisible(true), 6000);
    return () => window.clearTimeout(timer);
  }, [publicPage]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_FOR_MS));
    } catch {
      // Closing the invite must still work if storage is blocked.
    }
  }

  if (!publicPage || !visible) return null;

  return (
    <aside
      aria-label="Join the EazyTool Telegram channel"
      className="fixed right-4 top-24 z-[60] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-sky-400/30 bg-card p-4 text-card-foreground shadow-2xl shadow-sky-950/20 sm:right-6"
    >
      <button
        type="button"
        aria-label="Close Telegram invitation"
        onClick={dismiss}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <div className="flex size-11 items-center justify-center rounded-xl bg-[#229ED9] text-white">
        <Send className="size-5 -translate-x-0.5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">EazyTool community</p>
      <h2 className="mt-1 pr-5 text-lg font-semibold">Join our Telegram channel</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Follow EazyTool on Telegram for updates and helpful tips.</p>
      <a
        href={CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={dismiss}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#168ac2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Join channel <ArrowUpRight className="size-4" aria-hidden="true" />
      </a>
    </aside>
  );
}
