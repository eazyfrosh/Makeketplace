import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { isFirebaseConfigured, storage } from "@/lib/firebase/client";

const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function uploadSupportLogo(userId: string, siteId: string, file: File) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) throw new Error("Choose a PNG, JPG, or WebP image.");
  if (file.size > MAX_LOGO_BYTES) throw new Error("The logo must be 2 MB or smaller.");

  if (isFirebaseConfigured && storage) {
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const objectRef = ref(storage, `support-sites/${userId}/${siteId}/logo-${crypto.randomUUID()}.${extension}`);
    await uploadBytes(objectRef, file, { contentType: file.type, customMetadata: { siteId } });
    return getDownloadURL(objectRef);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The logo could not be read."));
    reader.readAsDataURL(file);
  });
}
