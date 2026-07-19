"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { createTicket, getTicketsForUser } from "@/lib/services/support";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { SupportTicket } from "@/types";

const STATUS_VARIANT: Record<SupportTicket["status"], "soft" | "outline" | "default"> = {
  open: "soft",
  pending: "outline",
  resolved: "default",
};

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  const refresh = React.useCallback(() => {
    if (!user) return;
    getTicketsForUser(user.id).then((data) =>
      setTickets(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    );
  }, [user]);

  React.useEffect(() => refresh(), [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await createTicket({ userId: user.id, subject, message });
      toast.success("Support ticket created");
      setSubject("");
      setMessage("");
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Support tickets</h1>
      <p className="mt-2 text-muted-foreground">
        Have an issue with a purchase or delivery? We usually respond within a few hours.
      </p>

      <form onSubmit={handleSubmit} className="glass mt-8 space-y-4 rounded-2xl p-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Issue with my Website Design order"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's going on…"
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Submit ticket
        </Button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Your tickets</h2>
        {tickets.length === 0 ? (
          <EmptyState className="mt-4" title="No tickets yet" description="Submitted tickets will appear here." />
        ) : (
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{ticket.subject}</span>
                  <Badge variant={STATUS_VARIANT[ticket.status]} className="capitalize">
                    {ticket.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{ticket.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
