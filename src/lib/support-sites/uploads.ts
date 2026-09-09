import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { isFirebaseConfigured, storage } from "@/lib/firebase/client";

const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function optimizeLogo(file: File) {
  const bitmap = await createImageBitmap(file);
  if (bitmap.width <= 512 && bitmap.height <= 512 && file.size <= 300 * 1024) {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob) return file;
  return new File([blob], "optimized-logo.webp", { type: "image/webp" });
}

export async function uploadSupportLogo(userId: string, siteId: string, file: File, onProgress?: (progress: number) => void) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) throw new Error("Choose a PNG, JPG, or WebP image.");
  if (file.size > MAX_LOGO_BYTES) throw new Error("The logo must be 2 MB or smaller.");
  onProgress?.(5);
  const optimized = await optimizeLogo(file).catch(() => file);
  onProgress?.(20);

  if (isFirebaseConfigured && storage) {
    const extension = optimized.type === "image/png" ? "png" : optimized.type === "image/webp" ? "webp" : "jpg";
    const objectRef = ref(storage, `support-sites/${userId}/${siteId}/logo-${crypto.randomUUID()}.${extension}`);
    const task = uploadBytesResumable(objectRef, optimized, { contentType: optimized.type, customMetadata: { siteId } });
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => { task.cancel(); reject(new Error("Upload timed out. Please check Firebase Storage and try again.")); }, 25000);
      task.on("state_changed", (snapshot) => onProgress?.(20 + Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 75)), (error) => { window.clearTimeout(timeout); reject(error); }, () => { window.clearTimeout(timeout); resolve(); });
    });
    onProgress?.(98);
    const url = await getDownloadURL(objectRef);
    onProgress?.(100);
    return url;
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The logo could not be read."));
    reader.onloadend = () => onProgress?.(100);
    reader.readAsDataURL(optimized);
  });
}
