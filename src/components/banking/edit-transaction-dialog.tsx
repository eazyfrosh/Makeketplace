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
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await onSave({ description, counterparty, reference, status });
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
            Amount and direction can&apos;t be edited here, so the balance always matches an auditable
            transaction — use a balance adjustment for that instead. This only edits how the receipt reads.
          </p>
          <div>
            <Label htmlFor="edit-tx-description">Description</Label>
            <Input id="edit-tx-description" value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <SelectTrigger className="w-full">
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
