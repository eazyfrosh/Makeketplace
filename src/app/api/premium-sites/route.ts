import { del, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getLicenseForUserAndService } from "@/lib/licensing/store";
import type { PremiumSite } from "@/lib/premium-sites/types";

const PREFIX = "premium-data/sites/";
const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
async function readSite(url: string): Promise<PremiumSite | null> { try { const response = await fetch(url, { cache: "no-store" }); return response.ok ? await response.json() as PremiumSite : null; } catch { return null; } }
async function allSites() { const result = await list({ prefix: PREFIX, limit: 1000 }); const rows = await Promise.all(result.blobs.map((blob) => readSite(blob.url))); return rows.filter((row): row is PremiumSite => Boolean(row)); }
async function canManagePremiumSites(uid: string, role: string) { if (role === "admin") return true; const license = await getLicenseForUserAndService(uid, "premium-templates"); return Boolean(license && license.status === "active" && (!license.expiresAt || new Date(license.expiresAt).getTime() > Date.now())); }

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug")?.trim();
    if (slug) return NextResponse.json((await allSites()).find((site) => site.slug === slug && site.status === "published") ?? null);
    const caller = await verifyCaller(request);
    if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    if (!(await canManagePremiumSites(caller.uid, caller.role))) return NextResponse.json({ error: "An active Premium Templates license is required." }, { status: 403 });
    const sites = await allSites();
    return NextResponse.json(caller.role === "admin" ? sites : sites.filter((site) => site.userId === caller.uid));
  } catch (error) { console.error("[premium-sites] read failed", error); return NextResponse.json({ error: "Premium websites are temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!(await canManagePremiumSites(caller.uid, caller.role))) return NextResponse.json({ error: "An active Premium Templates license is required." }, { status: 403 });
  try {
    const input = await request.json() as PremiumSite;
    const id = safeId(String(input.id || ""));
    if (!id || !input.name?.trim() || !input.slug?.trim()) return NextResponse.json({ error: "Website name and slug are required." }, { status: 400 });
    const sites = await allSites();
    const existing = sites.find((site) => site.id === id);
    if (existing && caller.role !== "admin" && existing.userId !== caller.uid) return NextResponse.json({ error: "You do not have access to this website." }, { status: 403 });
    const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 100);
    if (sites.some((site) => site.id !== id && site.slug === slug)) return NextResponse.json({ error: "That public slug is already in use." }, { status: 409 });
    const now = new Date().toISOString();
    const site: PremiumSite = { ...input, id, slug, templateId: "volterra-ev", userId: existing?.userId ?? caller.uid, createdAt: existing?.createdAt ?? now, updatedAt: now };
    await put(`${PREFIX}${id}.json`, JSON.stringify(site), { access: "public", allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });
    return NextResponse.json(site);
  } catch (error) { console.error("[premium-sites] save failed", error); return NextResponse.json({ error: "The premium website could not be saved." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!(await canManagePremiumSites(caller.uid, caller.role))) return NextResponse.json({ error: "An active Premium Templates license is required." }, { status: 403 });
  try {
    const id = safeId(new URL(request.url).searchParams.get("id") ?? "");
    const result = await list({ prefix: `${PREFIX}${id}.json`, limit: 1 });
    const blob = result.blobs[0];
    if (!blob) return NextResponse.json({ ok: true });
    const site = await readSite(blob.url);
    if (site && caller.role !== "admin" && site.userId !== caller.uid) return NextResponse.json({ error: "You do not have access to this website." }, { status: 403 });
    await del(blob.url);
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("[premium-sites] delete failed", error); return NextResponse.json({ error: "The premium website could not be deleted." }, { status: 503 }); }
}
