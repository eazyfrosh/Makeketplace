"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { Button } from "@/components/airline/ui/button";

interface DownloadPdfButtonProps {
  label?: string;
  targetSelector?: string;
  filename?: string;
}
export function DownloadPdfButton({
  label = "Download PDF",
  targetSelector = ".printable-itinerary",
  filename = "skybook-itinerary.pdf",
}: DownloadPdfButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadPdf() {
    if (isDownloading) return;
    const source = document.querySelector<HTMLElement>(targetSelector);
    if (!source) {
      window.alert("The PDF content is not available yet. Please try again.");
      return;
    }

    setIsDownloading(true);
    let captureViewport: HTMLDivElement | null = null;

    try {
      // Capture one A4 page at a time. A single tall browser canvas can be
      // scaled down or clipped, which loses the bottom of long itineraries.
      const exportRoot = source.cloneNode(true) as HTMLElement;
      exportRoot.classList.remove("hidden");
      exportRoot.classList.remove("print:block");
      exportRoot.classList.remove("print:bg-white", "print:text-black");
      captureViewport = document.createElement("div");
      captureViewport.style.position = "fixed";
      captureViewport.style.left = "0";
      captureViewport.style.top = "0";
      captureViewport.style.width = "190mm";
      captureViewport.style.overflow = "hidden";
      captureViewport.style.backgroundColor = "#ffffff";
      captureViewport.style.zIndex = "9999";
      captureViewport.style.pointerEvents = "none";
      exportRoot.style.position = "absolute";
      exportRoot.style.left = "0";
      exportRoot.style.top = "0";
      exportRoot.style.width = "190mm";
      if (source.classList.contains("printable-itinerary")) {
        exportRoot.style.backgroundColor = "#ffffff";
        exportRoot.style.color = "#000000";
      }
      captureViewport.appendChild(exportRoot);
      document.body.appendChild(captureViewport);

      // Airline logos are loaded from an external provider. Embed each logo
      // as a data URL in the temporary clone so the canvas keeps the actual
      // logo without becoming tainted by a cross-origin image.
      await Promise.all(
        [...exportRoot.querySelectorAll<HTMLImageElement>("img")].map(async (image) => {
          if (!image.src.startsWith("http")) return;
          try {
            const response = await fetch(image.src, { mode: "cors" });
            if (!response.ok) return;
            const blob = await response.blob();
            image.src = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });
          } catch {
            // Keep the original image if the provider does not allow CORS.
          }
        })
      );

      await document.fonts.ready;
      await Promise.all([...exportRoot.querySelectorAll("img")].map((image) => image.decode().catch(() => {})));
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const horizontalMargin = 15;
      const verticalMargin = 10;
      const pageWidth = 210 - horizontalMargin * 2;
      const pageHeight = 297 - verticalMargin * 2;
      const widthPx = Math.ceil(exportRoot.getBoundingClientRect().width);
      const contentHeightPx = Math.ceil(Math.max(exportRoot.scrollHeight, exportRoot.getBoundingClientRect().height));
      if (!widthPx || !contentHeightPx) throw new Error("PDF content has no visible dimensions");
      const pageHeightPx = Math.floor((widthPx * pageHeight) / pageWidth);
      const pageCount = Math.ceil(contentHeightPx / pageHeightPx);
      captureViewport.style.width = `${widthPx}px`;
      captureViewport.style.height = `${pageHeightPx}px`;

      for (let page = 0; page < pageCount; page += 1) {
        exportRoot.style.top = `${-page * pageHeightPx}px`;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const imageData = await toPng(captureViewport, {
          width: widthPx,
          height: pageHeightPx,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          skipAutoScale: true,
        });
        if (page > 0) pdf.addPage();
        pdf.addImage(imageData, "PNG", horizontalMargin, verticalMargin, pageWidth, pageHeight);
      }

      pdf.save(filename);
    } catch (error) {
      console.error("Unable to download PDF", error);
      window.alert("The PDF could not be downloaded. Please try again.");
    } finally {
      captureViewport?.remove();
      setIsDownloading(false);
    }
  }

  return (
    <Button variant="outline" onClick={downloadPdf} disabled={isDownloading} aria-busy={isDownloading}>
      {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {isDownloading ? "Preparing PDF…" : label}
    </Button>
  );
}
