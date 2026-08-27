"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/airline/ui/button";

export function DownloadPdfButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Download size={16} /> {label}
    </Button>
  );
}
