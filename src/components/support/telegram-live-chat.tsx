import { MessageCircle, Send } from "lucide-react";

function getTelegramSupportUrl() {
  const configuredUrl = process.env.TELEGRAM_SUPPORT_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);
    const hostname = url.hostname.toLowerCase();
    const isTelegramHost = hostname === "t.me" || hostname === "telegram.me";
    const hasDestination = url.pathname.replaceAll("/", "").length > 0;

    if (url.protocol !== "https:" || !isTelegramHost || !hasDestination) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function TelegramLiveChat() {
  const telegramUrl = getTelegramSupportUrl();

  if (!telegramUrl) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-[70] flex items-center gap-3 sm:bottom-6 sm:right-6">
      <div className="hidden rounded-2xl border border-sky-200/70 bg-background/95 px-4 py-3 text-right shadow-xl shadow-sky-950/10 backdrop-blur sm:block dark:border-sky-900/70">
        <div className="flex items-center justify-end gap-1.5 text-sm font-semibold text-foreground">
          <MessageCircle className="size-4 text-sky-500" aria-hidden="true" />
          Need help?
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Chat with us on Telegram</p>
      </div>

      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with EazyTool support on Telegram"
        title="Chat with us on Telegram"
        className="group grid size-14 place-items-center rounded-full bg-[#229ED9] text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-1 hover:bg-[#168ac2] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:size-16"
      >
        <Send className="size-6 -translate-x-0.5 transition-transform group-hover:translate-x-0 group-hover:-translate-y-0.5 sm:size-7" aria-hidden="true" />
      </a>
    </div>
  );
}
