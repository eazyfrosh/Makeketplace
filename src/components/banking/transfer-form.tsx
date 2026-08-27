"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { transfer } from "@/lib/banking/client";
import { formatCurrency, maskAccountNumber } from "@/lib/banking/format";
import type { Account } from "@/lib/banking/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Kind = "internal" | "bank" | "international";
type Step = "form" | "preview" | "receipt";

interface FormValues {
  amount: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  note: string;
}

export function TransferForm({ account }: { account: Account }) {
  const [kind, setKind] = React.useState<Kind>("internal");
  const [step, setStep] = React.useState<Step>("form");
  const [pinOpen, setPinOpen] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState<{ reference: string; status: string } | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { amount: "", recipientName: "", recipientAccount: "", recipientBank: "", note: "" },
  });

  function goToPreview() {
    setStep("preview");
  }

  async function confirmWithPin() {
    if (pin.length !== 4) return;
    setSubmitting(true);
    try {
      const data = getValues();
      const result = await transfer({
        kind,
        amount: Number(data.amount),
        pin,
        recipientName: data.recipientName,
        recipientAccount: data.recipientAccount,
        recipientBank: data.recipientBank || undefined,
        note: data.note || undefined,
      });
      setReceipt({ reference: result.reference, status: result.status });
      setPinOpen(false);
      setPin("");
      setStep("receipt");
      toast.success("Transfer submitted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    reset();
    setPin("");
    setReceipt(null);
    setKind("internal");
    setStep("form");
  }

  const values = getValues();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardContent>
          {step === "form" && (
            <form onSubmit={handleSubmit(goToPreview)} className="flex flex-col gap-5">
              <div>
                <Label className="mb-1.5 block">Transfer type</Label>
                <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="internal">Internal</TabsTrigger>
                    <TabsTrigger value="bank">Bank transfer</TabsTrigger>
                    <TabsTrigger value="international">International</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <Label className="mb-1.5 block">From account</Label>
                <p className="text-sm text-muted-foreground">
                  {account.name} &middot; {formatCurrency(account.balance, account.currency)}
                </p>
              </div>

              <div>
                <Label className="mb-1.5 block">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("amount", { required: true, min: 0.01 })}
                />
                {errors.amount && <p className="mt-1 text-xs text-destructive">Enter a valid amount.</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">Recipient name</Label>
                <Input placeholder="Full name" {...register("recipientName", { required: true })} />
                {errors.recipientName && <p className="mt-1 text-xs text-destructive">Required.</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">
                  {kind === "internal" ? "Recipient account number" : "Account / IBAN number"}
                </Label>
                <Input placeholder="0123456789" {...register("recipientAccount", { required: true })} />
                {errors.recipientAccount && <p className="mt-1 text-xs text-destructive">Required.</p>}
              </div>

              {kind !== "internal" && (
                <div>
                  <Label className="mb-1.5 block">Bank name</Label>
                  <Input placeholder="e.g. First National Bank" {...register("recipientBank")} />
                </div>
              )}

              <div>
                <Label className="mb-1.5 block">Note (optional)</Label>
                <Textarea placeholder="What's this for?" {...register("note")} />
              </div>

              <Button type="submit" size="lg">
                Review transfer
              </Button>
            </form>
          )}

          {step === "preview" && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Review your transfer</h2>
              <div className="divide-border/60 divide-y text-sm">
                {[
                  ["From", account.name],
                  ["Amount", formatCurrency(Number(values.amount), account.currency)],
                  ["Recipient", values.recipientName],
                  ["Account", values.recipientAccount],
                  ...(values.recipientBank ? [["Bank", values.recipientBank]] : []),
                  ["Note", values.note || "—"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setPinOpen(true)} className="flex-1">
                  <ShieldCheck className="size-4" />
                  Confirm with PIN
                </Button>
              </div>
            </div>
          )}

          {step === "receipt" && receipt && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="bg-success/10 text-success flex size-14 items-center justify-center rounded-full">
                <CheckCircle2 className="size-7" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  {receipt.status === "completed" ? "Transfer successful" : "Transfer submitted"}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {receipt.status === "completed"
                    ? "Your money is on its way."
                    : "Your transfer is pending review and will complete shortly."}
                </p>
              </div>

              <Card className="w-full max-w-sm text-left">
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono font-medium">{receipt.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(Number(values.amount), account.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">{values.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">{maskAccountNumber(values.recipientAccount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">{receipt.status}</span>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={startOver} className="w-full max-w-sm">
                New transfer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardContent className="space-y-3 text-sm">
          <h3 className="font-semibold">Transfer tips</h3>
          <p className="text-muted-foreground">
            Internal transfers are instant. Bank and international transfers may take up to 24 hours and
            include a small processing fee.
          </p>
          <p className="text-muted-foreground">
            Never share your transaction PIN with anyone, including Nexova staff.
          </p>
        </CardContent>
      </Card>

      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm transaction PIN</DialogTitle>
            <DialogDescription>
              Enter your 4-digit PIN to authorize this transfer of{" "}
              {formatCurrency(Number(values.amount), account.currency)}.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="text-center text-2xl tracking-[0.5em]"
          />
          <DialogFooter>
            <Button onClick={confirmWithPin} disabled={submitting || pin.length !== 4} className="w-full">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Authorize transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
