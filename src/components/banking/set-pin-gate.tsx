"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { setPin as setPinRequest } from "@/lib/banking/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Blocks transfer/card-reveal flows until the licensee has set up a 4-digit
 * transaction PIN — those endpoints refuse to act without one anyway; this
 * is just the friendlier front door instead of a raw 400 from the API.
 */
export function SetPinGate({ onDone }: { onDone: () => void }) {
  const [pin, setPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      toast.error("PIN must be 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await setPinRequest(pin);
      toast.success("Transaction PIN set.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set PIN.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <ShieldCheck className="size-6" />
        </span>
        <div>
          <h2 className="font-semibold">Set up a transaction PIN</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A 4-digit PIN authorizes transfers and reveals card details — required before you can use them.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <div className="text-left">
            <Label>New PIN</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em]"
            />
          </div>
          <div className="text-left">
            <Label>Confirm PIN</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em]"
            />
          </div>
          <Button type="submit" disabled={submitting || pin.length !== 4} className="mt-2 w-full">
            {submitting ? "Saving…" : "Set PIN"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
