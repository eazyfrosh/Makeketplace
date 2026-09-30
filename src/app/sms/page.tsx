"use client";
import * as React from "react";
import { Loader2, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { SMS_COUNTRIES, calculateSegments } from "@/lib/sms/core";
import type { SmsRecord } from "@/lib/sms/types";
import { useRouter } from "next/navigation";
export default function SmsPage() {
  const { user, loading: authLoading } = useAuth(),
    router = useRouter();
  const [country, setCountry] = React.useState("US"),
    [phone, setPhone] = React.useState(""),
    [message, setMessage] = React.useState(""),
    [consent, setConsent] = React.useState(false),
    [sending, setSending] = React.useState(false),
    [history, setHistory] = React.useState<SmsRecord[]>([]);
  const segments = message.trim()
    ? (() => {
        try {
          return calculateSegments(message);
        } catch {
          return 1;
        }
      })()
    : 1;
  const load = React.useCallback(async () => {
    const r = await fetch("/api/sms/history", {
        headers: await getAuthHeaders(),
        cache: "no-store",
      }),
      d = await r.json();
    if (r.ok) setHistory(d.messages ?? []);
  }, []);
  React.useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?next=/sms");
    if (user) void load();
  }, [authLoading, user, router, load]);
  async function send() {
    setSending(true);
    try {
      const r = await fetch("/api/sms/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
          },
          body: JSON.stringify({
            country,
            phone,
            message,
            consent,
            requestId: crypto.randomUUID(),
          }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "The message could not be sent.");
      toast.success("Message queued successfully.");
      setMessage("");
      setConsent(false);
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "The message could not be sent.",
      );
    } finally {
      setSending(false);
    }
  }
  if (authLoading || !user)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-primary">Communication</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
        SMS Flashing
      </h1>
      <p className="mt-2 text-muted-foreground">
        Compose, send, and track consent-based SMS messages internationally.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquareText />
            </span>
            <div>
              <h2 className="font-semibold">New message</h2>
              <p className="text-sm text-muted-foreground">
                Enter the recipient and message below.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Country
              <select
                className="mt-2 h-12 w-full rounded-xl border bg-background px-3 font-normal"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {SMS_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} {c.dial}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Phone Number
              <input
                className="mt-2 h-12 w-full rounded-xl border bg-background px-3 font-normal"
                inputMode="tel"
                placeholder="415 555 2671"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>
          <label className="mt-5 block text-sm font-medium">
            Message
            <textarea
              className="mt-2 min-h-40 w-full resize-y rounded-xl border bg-background p-4 font-normal"
              maxLength={1600}
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Characters: {message.length}</span>
            <span>SMS segments: {segments}</span>
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm">
            <input
              className="mt-1 size-4"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I confirm that this recipient has consented to receive this
              message.
            </span>
          </label>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Only send messages to recipients who have consented to receive them.
            Spam, harassment, impersonation and unsolicited bulk messaging are
            prohibited.
          </p>
          <Button
            className="mt-6 w-full sm:w-auto"
            size="lg"
            disabled={sending || !consent || !phone.trim() || !message.trim()}
            onClick={send}
          >
            {sending ? <Loader2 className="animate-spin" /> : <Send />}Send SMS
          </Button>
        </section>
        <aside className="h-fit rounded-3xl border bg-muted/30 p-5">
          <ShieldCheck className="size-6 text-primary" />
          <h2 className="mt-3 font-semibold">Before you send</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Messages are queued through EazyTools. Delivery is confirmed later
            by Twilio, so a queued message is not yet delivered.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Trial accounts may only reach recipients permitted by your current
            Twilio trial configuration.
          </p>
        </aside>
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Recent messages</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
          {history.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No messages yet. Queued messages will appear here.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-2 border-b p-4 last:border-0 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-medium">{item.destination}</p>
                  <p className="max-w-xl truncate text-sm text-muted-foreground">
                    {item.messagePreview}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm capitalize">{item.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.segments} segment{item.segments === 1 ? "" : "s"} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
