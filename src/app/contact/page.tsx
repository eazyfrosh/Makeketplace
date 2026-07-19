"use client";

import * as React from "react";
import { Loader2, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [submitting, setSubmitting] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Message sent — we'll get back to you within a day.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="text-sm font-medium text-primary">Contact</span>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Let&apos;s talk</h1>
        <p className="mt-4 text-muted-foreground">
          Questions about a service, a custom quote, or existing order? Send us a message.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <div className="glass flex items-start gap-3 rounded-xl p-4">
            <Mail className="mt-0.5 size-5 text-primary" />
            <div>
              <div className="font-medium">Email</div>
              <div className="text-sm text-muted-foreground">hello@nexova.io</div>
            </div>
          </div>
          <div className="glass flex items-start gap-3 rounded-xl p-4">
            <MessageCircle className="mt-0.5 size-5 text-primary" />
            <div>
              <div className="font-medium">Live chat</div>
              <div className="text-sm text-muted-foreground">
                Available in-app, weekdays 9am–6pm
              </div>
            </div>
          </div>
          <div className="glass flex items-start gap-3 rounded-xl p-4">
            <MapPin className="mt-0.5 size-5 text-primary" />
            <div>
              <div className="font-medium">Remote-first</div>
              <div className="text-sm text-muted-foreground">Serving clients worldwide</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass space-y-4 rounded-2xl p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@company.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" required placeholder="Custom banking platform quote" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" required placeholder="Tell us about your project…" />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Send message
          </Button>
        </form>
      </div>
    </div>
  );
}
