import { getAuthHeaders } from "@/lib/licensing/client-auth";

const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function optimizeLogo(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("The logo could not be prepared.");
  return new File([blob], "logo.webp", { type: "image/webp" });
}

export async function uploadSupportLogo(_userId: string, siteId: string, file: File) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) throw new Error("Choose a PNG, JPG, or WebP image.");
  if (file.size > MAX_LOGO_BYTES) throw new Error("The logo must be 2 MB or smaller.");

  const optimized = await optimizeLogo(file);
  const form = new FormData();
  form.set("file", optimized);
  form.set("siteId", siteId);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/support-sites/logo-upload", { method: "POST", headers, body: form, signal: controller.signal });
    const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "The logo could not be uploaded.");
    return result.url;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The upload timed out. Please try again.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
