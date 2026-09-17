"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Button } from "@/components/airline/ui/button";

export function DownloadPdfButton({ label = "Download PDF" }: { label?: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadItinerary() {
    const itinerary = document.querySelector<HTMLElement>(".printable-itinerary");
    // Boarding-pass pages share this button but intentionally have no itinerary
    // document. Keep their existing browser-print behavior unchanged.
    if (!itinerary) {
      window.print();
      return;
    }
    if (isDownloading) return;

    setIsDownloading(true);
    const originalStyle = itinerary.getAttribute("style");

    try {
      itinerary.style.display = "block";
      itinerary.style.position = "absolute";
      itinerary.style.left = "-10000px";
      itinerary.style.top = "0";
      itinerary.style.width = "190mm";
      itinerary.style.background = "#ffffff";
      itinerary.style.color = "#000000";

      const canvas = await html2canvas(itinerary, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const pdf = new jsPDF({ format: "a4", unit: "mm", orientation: "portrait" });
      const margin = 10;
      const contentWidth = 210 - margin * 2;
      const contentHeight = 297 - margin * 2;
      const pageHeightPx = (canvas.width * contentHeight) / contentWidth;

      for (let page = 0, sourceY = 0; sourceY < canvas.height; page += 1, sourceY += pageHeightPx) {
        if (page > 0) pdf.addPage();
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = Math.min(pageHeightPx, canvas.height - sourceY);
        slice.getContext("2d")?.drawImage(canvas, 0, sourceY, canvas.width, slice.height, 0, 0, slice.width, slice.height);
        const sliceHeight = (slice.height * contentWidth) / canvas.width;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, contentWidth, sliceHeight);
      }

      pdf.save("skybook-itinerary.pdf");
    } finally {
      if (originalStyle === null) itinerary.removeAttribute("style");
      else itinerary.setAttribute("style", originalStyle);
      setIsDownloading(false);
    }
  }

  return (
    <Button variant="outline" onClick={downloadItinerary} disabled={isDownloading}>
      <Download size={16} /> {isDownloading ? "Preparing PDF…" : label}
    </Button>
  );
}
