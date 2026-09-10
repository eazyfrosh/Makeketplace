import { del, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import type { SupportSite } from "@/lib/support-sites/types";

const SITE_PREFIX = "support-data/sites/";
const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);

async function readSite(url: string): Promise<SupportSite | null> {
  try { const response = await fetch(url, { cache: "no-store" }); return response.ok ? await response.json() as SupportSite : null; }
  catch { return null; }
}

async function findSite(id: string) { const result = await list({ prefix: `${SITE_PREFIX}${safeId(id)}.json`, limit: 1 }); return result.blobs[0] ? readSite(result.blobs[0].url) : null; }
async function listSites() { const result = await list({ prefix: SITE_PREFIX, limit: 1000 }); const sites = await Promise.all(result.blobs.map((blob) => readSite(blob.url))); return sites.filter((site): site is SupportSite => Boolean(site)); }

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim();
    if (slug) return NextResponse.json((await listSites()).find((site) => site.slug === slug && site.status === "published") ?? null);
    const caller = await verifyCaller(request);
    if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    const id = url.searchParams.get("id");
    if (id) { const site = await findSite(id); if (!site) return NextResponse.json(null); if (caller.role !== "admin" && site.userId !== caller.uid) return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 }); return NextResponse.json(site); }
    const sites = await listSites();
    return NextResponse.json(caller.role === "admin" ? sites : sites.filter((site) => site.userId === caller.uid));
  } catch (error) { console.error("[support-sites] read failed", error); return NextResponse.json({ error: "Support projects are temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  try {
    const input = await request.json() as SupportSite;
    const id = safeId(String(input.id || ""));
    if (!id || !input.name?.trim() || !input.slug?.trim()) return NextResponse.json({ error: "Site name, ID, and slug are required." }, { status: 400 });
    const existing = await findSite(id);
    if (existing && caller.role !== "admin" && existing.userId !== caller.uid) return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
    const now = new Date().toISOString();
    const site: SupportSite = { ...input, id, userId: existing?.userId ?? (caller.role === "admin" && input.userId ? input.userId : caller.uid), name: input.name.trim(), slug: input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 100), createdAt: existing?.createdAt ?? input.createdAt ?? now, updatedAt: now };
    await put(`${SITE_PREFIX}${id}.json`, JSON.stringify(site), { access: "public", allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });
    return NextResponse.json(site);
  } catch (error) { console.error("[support-sites] save failed", error); return NextResponse.json({ error: "The support project could not be saved." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  try {
    const id = safeId(new URL(request.url).searchParams.get("id") ?? "");
    if (!id) return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    const result = await list({ prefix: `${SITE_PREFIX}${id}.json`, limit: 1 }); const blob = result.blobs[0];
    if (!blob) return NextResponse.json({ ok: true });
    const site = await readSite(blob.url);
    if (site && caller.role !== "admin" && site.userId !== caller.uid) return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
    await del(blob.url); return NextResponse.json({ ok: true });
  } catch (error) { console.error("[support-sites] delete failed", error); return NextResponse.json({ error: "The support project could not be deleted." }, { status: 503 }); }
}
