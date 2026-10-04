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

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) {
    return image.naturalWidth > 0 ? Promise.resolve() : Promise.reject(new Error("Image failed to load"));
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Image load timed out")), 8000);
    image.addEventListener("load", () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
    image.addEventListener("error", () => {
      window.clearTimeout(timeout);
      reject(new Error("Image failed to load"));
    }, { once: true });
  });
}

function showAirlineFallback(image: HTMLImageElement) {
  const logo = image.closest<HTMLElement>("[data-airline-logo]");
  const fallback = logo?.querySelector<HTMLElement>("[data-airline-logo-fallback]");
  if (!fallback) return false;
  fallback.style.opacity = "1";
  fallback.setAttribute("aria-hidden", "false");
  image.remove();
  return true;
}

async function embedExportImage(image: HTMLImageElement) {
  const src = image.currentSrc || image.src;
  if (!src) throw new Error("Image has no source");

  if (!src.startsWith("data:")) {
    const response = await fetch(src, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Image request failed with ${response.status}`);
    image.removeAttribute("srcset");
    image.removeAttribute("crossorigin");
    image.src = await readBlobAsDataUrl(await response.blob());
  }

  await waitForImage(image);
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

      // Embed every image before html-to-image serializes the page. iOS Safari
      // can omit images fetched while it rasterizes the temporary SVG. If an
      // airline image still cannot be embedded, reveal its branded code badge
      // so the exported itinerary never contains an empty logo box.
      await Promise.all(
        [...exportRoot.querySelectorAll<HTMLImageElement>("img")].map(async (image) => {
          try {
            await embedExportImage(image);
          } catch (error) {
            if (!showAirlineFallback(image)) throw error;
          }
        })
      );

      await document.fonts.ready;
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
          cacheBust: true,
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
