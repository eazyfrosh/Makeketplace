import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { PremiumSite } from "./types";

async function request<T>(path = "", init?: RequestInit): Promise<T> {
  const headers = { ...(await getAuthHeaders()), ...(init?.headers ?? {}) };
  const response = await fetch(`/api/premium-sites${path}`, { ...init, headers, cache: "no-store" });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "The premium website request failed.");
  return result;
}

export const getPremiumSites = () => request<PremiumSite[]>();
export const savePremiumSite = (site: PremiumSite) => request<PremiumSite>("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(site) });
export const deletePremiumSite = (id: string) => request<{ ok: boolean }>(`?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export async function getPublishedPremiumSite(slug: string) {
  const response = await fetch(`/api/premium-sites?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
  return response.ok ? await response.json() as PremiumSite | null : null;
}
