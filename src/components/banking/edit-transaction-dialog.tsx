"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Transaction, TransactionStatus } from "@/lib/banking/types";

const statuses: TransactionStatus[] = ["pending", "completed", "failed", "cancelled"];

interface EditableFields {
  description: string;
  counterparty: string;
  reference: string;
  status: TransactionStatus;
  amount: number;
  direction: "credit" | "debit";
}

export function EditTransactionDialog({
  transaction,
  onSave,
  onSaved,
}: {
  transaction: Transaction;
  /** Performs the actual update (admin route or self-service route) and returns the saved transaction. */
  onSave: (updates: EditableFields) => Promise<Transaction>;
  onSaved: (updated: Transaction) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [description, setDescription] = React.useState(transaction.description);
  const [counterparty, setCounterparty] = React.useState(transaction.counterparty ?? "");
  const [reference, setReference] = React.useState(transaction.reference);
  const [status, setStatus] = React.useState<TransactionStatus>(transaction.status);
  const [amount, setAmount] = React.useState(String(transaction.amount));
  const [direction, setDirection] = React.useState<"credit" | "debit">(transaction.direction);
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    const parsedAmount = Number(amount);
    if (!(parsedAmount > 0)) {
      toast.error("Amount must be a positive number.");
      return;
    }
    setSaving(true);
    try {
      const updated = await onSave({ description, counterparty, reference, status, amount: parsedAmount, direction });
      toast.success("Transaction updated.");
      onSaved(updated);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil className="size-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit transaction receipt</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs">
            Changing the amount or direction updates the account balance to match — the difference is applied
            immediately, so the balance always reflects this transaction&apos;s new value.
          </p>
          <div>
            <Label htmlFor="edit-tx-description">Description</Label>
            <Input id="edit-tx-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-tx-amount">Amount</Label>
              <Input
                id="edit-tx-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-tx-direction">Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as "credit" | "debit")}>
                <SelectTrigger className="w-full" id="edit-tx-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-tx-counterparty">Counterparty</Label>
            <Input id="edit-tx-counterparty" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-tx-reference">Reference</Label>
            <Input id="edit-tx-reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-tx-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus)}>
              <SelectTrigger className="w-full" id="edit-tx-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
