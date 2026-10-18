import { randomUUID } from "node:crypto";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getLicenseForUserAndService } from "@/lib/licensing/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const license = await getLicenseForUserAndService(caller.uid, "logistics-platform");
  if (caller.role !== "admin" && (!license || license.status !== "active")) {
    return NextResponse.json({ error: "An active Logistics Platform license is required." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a package image to upload." }, { status: 400 });
  }

  const extension = IMAGE_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Only JPG, PNG and WebP images are allowed." }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "The package image must be 5 MB or smaller." }, { status: 413 });
  }

  try {
    const blob = await put(
      `logistics/${caller.uid}/shipment-content/${randomUUID()}.${extension}`,
      file,
      { access: "public", contentType: file.type, addRandomSuffix: false },
    );
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[logistics/content-image] upload failed", {
      userId: caller.uid,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "The package image could not be uploaded. Please try again." }, { status: 503 });
  }
}
