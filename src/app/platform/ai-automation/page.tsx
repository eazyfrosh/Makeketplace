'use client';

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { trackServiceUsage } from "@/lib/analytics/ga4";

const ReceiptLab = dynamic(() => import("@/components/receiptlab/ReceiptLab"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">
      Loading Receipt Generator…
    </div>
  ),
});

export default function AiAutomationPage() {
  useEffect(() => { trackServiceUsage("receipt-generator"); }, []);
  return <ReceiptLab />;
}
