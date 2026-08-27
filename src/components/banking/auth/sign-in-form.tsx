"use client";

import * as React from "react";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { loginBankingAccount } from "@/lib/banking/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function SignInForm({ onSuccess, onSwitchToSignUp }: { onSuccess: () => void; onSwitchToSignUp: () => void }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await loginBankingAccount({ email, password });
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <LogIn className="size-6" />
        </span>
        <div>
          <h2 className="font-semibold">Sign in to Banking</h2>
          <p className="text-muted-foreground mt-1 text-sm">Use the email and password you set up for this platform.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <div className="text-left">
            <Label htmlFor="banking-signin-email">Email</Label>
            <Input
              id="banking-signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="text-left">
            <Label htmlFor="banking-signin-password">Password</Label>
            <Input
              id="banking-signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <button type="button" onClick={onSwitchToSignUp} className="text-muted-foreground text-sm hover:underline">
          Don&apos;t have a banking account yet? Create one
        </button>
      </CardContent>
    </Card>
  );
}
