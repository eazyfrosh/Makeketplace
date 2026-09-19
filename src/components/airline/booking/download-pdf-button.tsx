"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { Button } from "@/components/airline/ui/button";

export function DownloadPdfButton({ label = "Download PDF" }: { label?: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadItinerary() {
    const source = document.querySelector<HTMLElement>(".printable-itinerary");
    // Boarding-pass pages do not mount PrintableItinerary and keep their
    // existing browser-print behavior.
    if (!source) {
      window.print();
      return;
    }
    if (isDownloading) return;

    setIsDownloading(true);
    let exportRoot: HTMLElement | null = null;

    try {
      // Keep the live itinerary hidden. Capture a temporary clone using the
      // existing markup and styles, without changing the designed document.
      exportRoot = source.cloneNode(true) as HTMLElement;
      exportRoot.classList.remove("hidden", "print:block", "print:bg-white", "print:text-black");
      exportRoot.style.position = "absolute";
      exportRoot.style.left = "0";
      exportRoot.style.top = "0";
      exportRoot.style.width = "190mm";
      exportRoot.style.backgroundColor = "#ffffff";
      exportRoot.style.color = "#000000";
      exportRoot.style.zIndex = "9999";
      exportRoot.style.pointerEvents = "none";
      document.body.appendChild(exportRoot);

      // Embed external airline logos in the temporary clone so the PDF keeps
      // the actual logos without a cross-origin rendering failure.
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
            // Keep the original logo if its provider does not allow CORS.
          }
        })
      );

      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const imageData = await toPng(exportRoot, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageMargin = 10;
      const pageWidth = 210 - pageMargin * 2;
      const pageHeight = 297 - pageMargin * 2;
      const imageDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Generated itinerary image could not be loaded"));
        image.src = imageData;
      });
      const imageHeight = (imageDimensions.height * pageWidth) / imageDimensions.width;
      const pageCount = Math.max(1, Math.ceil(imageHeight / pageHeight));

      for (let page = 0; page < pageCount; page += 1) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imageData, "PNG", pageMargin, pageMargin - page * pageHeight, pageWidth, imageHeight);
      }

      pdf.save("skybook-itinerary.pdf");
    } catch (error) {
      console.error("Unable to download itinerary PDF", error);
      window.alert("The itinerary PDF could not be downloaded. Please try again.");
    } finally {
      exportRoot?.remove();
      setIsDownloading(false);
    }
  }

  return (
    <Button variant="outline" onClick={downloadItinerary} disabled={isDownloading} aria-busy={isDownloading}>
      {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {isDownloading ? "Preparing PDF…" : label}
    </Button>
  );
}
