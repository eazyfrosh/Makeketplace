"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { registerBankingAccount } from "@/lib/banking/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function SignUpForm({ onSuccess, onSwitchToSignIn }: { onSuccess: () => void; onSwitchToSignIn: () => void }) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Enter your first and last name.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await registerBankingAccount({ email, password, firstName, lastName });
      toast.success("Banking account created.");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create your banking account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <UserPlus className="size-6" />
        </span>
        <div>
          <h2 className="font-semibold">Create your banking account</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A separate sign-in for the Banking Platform, tied to your Nexova account.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-left">
              <Label htmlFor="banking-signup-first-name">First name</Label>
              <Input
                id="banking-signup-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="text-left">
              <Label htmlFor="banking-signup-last-name">Last name</Label>
              <Input
                id="banking-signup-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="text-left">
            <Label htmlFor="banking-signup-email">Email</Label>
            <Input
              id="banking-signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="text-left">
            <Label htmlFor="banking-signup-password">Password</Label>
            <Input
              id="banking-signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </div>
          <div className="text-left">
            <Label htmlFor="banking-signup-confirm-password">Confirm password</Label>
            <Input
              id="banking-signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <button type="button" onClick={onSwitchToSignIn} className="text-muted-foreground text-sm hover:underline">
          Already have a banking account? Sign in
        </button>
      </CardContent>
    </Card>
  );
}
