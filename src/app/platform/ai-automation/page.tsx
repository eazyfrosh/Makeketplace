'use client';

import dynamic from "next/dynamic";

const ReceiptLab = dynamic(() => import("@/components/receiptlab/ReceiptLab"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">
      Loading AI Automation workspace…
    </div>
  ),
});

export default function AiAutomationPage() {
  return <ReceiptLab />;
}
