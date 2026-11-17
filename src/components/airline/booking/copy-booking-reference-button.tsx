"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/airline/ui/button";

function copyWithFallback(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "true");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  return copied ? Promise.resolve() : Promise.reject(new Error("Copy unavailable"));
}

export function CopyBookingReferenceButton({ reference, compact = false }: { reference: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await copyWithFallback(reference);
      setCopied(true);
      toast.success("Booking code copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the booking code. Please select it and copy manually.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Booking code copied" : "Copy booking code"}
      title={copied ? "Copied" : "Copy booking code"}
      className={compact ? "size-9 !p-0" : "shrink-0"}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {!compact && <span>{copied ? "Copied" : "Copy code"}</span>}
    </Button>
  );
}
