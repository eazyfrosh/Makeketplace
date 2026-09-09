import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const hasBlobCredentials = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
  if (!hasBlobCredentials) {
    return NextResponse.json(
      { error: "Vercel Blob is not connected to this deployment. Connect the store and redeploy." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const siteId = String(form?.get("siteId") || "site").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a logo to upload." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Only PNG, JPG, and WebP logos are allowed." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The logo must be 2 MB or smaller." }, { status: 413 });

  try {
    const blob = await put(`support-sites/${caller.uid}/${siteId || "site"}/logo.webp`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[support-sites/logo-upload] upload failed", error);
    return NextResponse.json({ error: "The logo upload failed. Please try again." }, { status: 500 });
  }
}
