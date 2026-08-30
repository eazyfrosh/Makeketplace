import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getWebsiteConfig, setWebsiteConfig } from "@/lib/website/store";
import type { WebsiteConfig } from "@/lib/website/types";

const DEFAULT_BRAND_COLOR = "#4f46e5";
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const existing = await getWebsiteConfig(caller.uid);
  if (existing) return NextResponse.json({ config: existing });

  // No saved config yet — hand back an unsaved draft so the editor and
  // preview always have something to render; nothing is written until the
  // licensee actually saves.
  const now = new Date().toISOString();
  const draft: WebsiteConfig = {
    userId: caller.uid,
    templateId: "default",
    siteName: "Your Business Name",
    tagline: null,
    logoUrl: null,
    phone: null,
    address: null,
    brandColor: DEFAULT_BRAND_COLOR,
    createdAt: now,
    updatedAt: now,
  };
  return NextResponse.json({ config: draft, isNew: true });
}

interface UpdateBody {
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  brandColor?: string;
  templateId?: string;
}

export async function PATCH(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  const siteName = body?.siteName?.trim();
  if (!siteName) {
    return NextResponse.json({ error: "Site name is required." }, { status: 400 });
  }
  if (body?.brandColor && !HEX_COLOR_RE.test(body.brandColor)) {
    return NextResponse.json({ error: "Brand color must be a valid hex color, e.g. #4f46e5." }, { status: 400 });
  }
  if (body?.logoUrl && !/^https?:\/\//i.test(body.logoUrl.trim())) {
    return NextResponse.json({ error: "Logo URL must start with http:// or https://." }, { status: 400 });
  }

  const existing = await getWebsiteConfig(caller.uid);
  const now = new Date().toISOString();
  const config: WebsiteConfig = {
    userId: caller.uid,
    templateId: body?.templateId?.trim() || existing?.templateId || "default",
    siteName,
    tagline: body?.tagline?.trim() || null,
    logoUrl: body?.logoUrl?.trim() || null,
    phone: body?.phone?.trim() || null,
    address: body?.address?.trim() || null,
    brandColor: body?.brandColor || existing?.brandColor || DEFAULT_BRAND_COLOR,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await setWebsiteConfig(config);

  return NextResponse.json({ config });
}
