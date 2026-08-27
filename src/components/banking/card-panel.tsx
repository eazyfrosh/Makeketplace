"use client";

import * as React from "react";
import { Eye, Loader2, RefreshCw, Snowflake } from "lucide-react";
import { toast } from "sonner";

import { freezeCard, replaceCard, revealCard, type RedactedCard } from "@/lib/banking/client";
import { formatCurrency } from "@/lib/banking/format";
import type { Transaction } from "@/lib/banking/types";

import { CardVisual } from "@/components/banking/card-visual";
import { TransactionRow } from "@/components/banking/transaction-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";

export function CardPanel({
  card,
  transactions,
  onChanged,
}: {
  card: RedactedCard;
  transactions: Transaction[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [pinDialogOpen, setPinDialogOpen] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [revealed, setRevealed] = React.useState<{ cardNumber: string; cvv: string; pin: string } | null>(null);

  async function toggleFreeze() {
    setBusy(true);
    try {
      await freezeCard();
      toast.success(card.status === "frozen" ? "Card unfrozen" : "Card frozen");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReplace() {
    setBusy(true);
    try {
      await replaceCard();
      toast.success("Card replaced. New details generated.");
      setRevealed(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReveal() {
    setBusy(true);
    try {
      const result = await revealCard(pin);
      setRevealed(result);
      setPinDialogOpen(false);
      setPin("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-4">
        <CardVisual card={card} revealedNumber={revealed ? formatRevealed(revealed.cardNumber) : undefined} />

        {revealed && (
          <Card className="border-primary/30">
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">CVV</p>
                <p className="font-mono font-medium">{revealed.cvv}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">PIN</p>
                <p className="font-mono font-medium">{revealed.pin}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={toggleFreeze} disabled={busy}>
            <Snowflake className="size-4" />
            {card.status === "frozen" ? "Unfreeze" : "Freeze"}
          </Button>

          <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="size-4" />
                Show PIN
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verify it&apos;s you</DialogTitle>
                <DialogDescription>Enter your transaction PIN to view card details.</DialogDescription>
              </DialogHeader>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="text-center text-2xl tracking-[0.5em]"
              />
              <DialogFooter>
                <Button onClick={handleReveal} disabled={busy || pin.length !== 4} className="w-full">
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Reveal details
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="size-4" />
                Replace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replace this card?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current card number will be permanently deactivated and a new one issued instantly.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReplace}>Replace card</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily limit</span>
              <span className="font-medium">{formatCurrency(card.dailyLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly limit</span>
              <span className="font-medium">{formatCurrency(card.monthlyLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{card.status}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h3 className="mb-2 font-semibold">Card transactions</h3>
          <div className="divide-border/60 divide-y">
            {transactions.length === 0 ? (
              <EmptyState title="No transactions on this card yet" />
            ) : (
              transactions.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatRevealed(cardNumber: string) {
  return cardNumber.replace(/(.{4})/g, "$1 ").trim();
}
