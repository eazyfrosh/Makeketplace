import { getAll, getOne, getWhere, upsert } from "@/lib/services/store";
import type { SupportSite, SupportSiteTicket, SupportTemplate } from "./types";
import { supportTemplates as builtInTemplates } from "./templates";
import { getAuthHeaders } from "@/lib/licensing/client-auth";

export const SUPPORT_SITES = "supportSites";
export const SUPPORT_TICKETS = "supportSiteTickets";
export const SUPPORT_TEMPLATES = "supportTemplates";
async function supportSiteRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = { ...(await getAuthHeaders()), ...(init?.headers ?? {}) };
  const response = await fetch(`/api/support-sites${path}`, { ...init, headers, cache: "no-store" });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "The support project request failed.");
  return result;
}
export const getSupportSite = (id: string) => supportSiteRequest<SupportSite | null>(`?id=${encodeURIComponent(id)}`);
export const getUserSupportSites = (userId: string) => { void userId; return supportSiteRequest<SupportSite[]>(""); };
export const getAllSupportSites = () => supportSiteRequest<SupportSite[]>("");
export const saveSupportSite = (site: SupportSite) => supportSiteRequest<SupportSite>("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(site) });
export const deleteSupportSite = (id: string) => supportSiteRequest<{ ok: boolean }>(`?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export async function getPublishedSupportSite(slug: string) {
  const response = await fetch(`/api/support-sites?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
  return response.ok ? await response.json() as SupportSite | null : null;
}
export const saveSupportTicket = (ticket: SupportSiteTicket) => upsert(SUPPORT_TICKETS, ticket);
export const getOwnerSupportTickets = (ownerId: string) => getWhere<SupportSiteTicket>(SUPPORT_TICKETS, "ownerId", ownerId);
export const getAllSupportTickets = () => getAll<SupportSiteTicket>(SUPPORT_TICKETS);

export async function getSupportTemplates(): Promise<SupportTemplate[]> {
  const saved = await getAll<SupportTemplate>(SUPPORT_TEMPLATES);
  if (!saved.length) return builtInTemplates;
  const savedById = new Map(saved.map((template) => [template.id, template]));
  return [
    ...builtInTemplates.map((template) => savedById.get(template.id) ?? template),
    ...saved.filter((template) => !builtInTemplates.some((item) => item.id === template.id)),
  ];
}

export async function getSupportTemplate(id: string): Promise<SupportTemplate | null> {
  const saved = await getOne<SupportTemplate>(SUPPORT_TEMPLATES, id);
  return saved ?? builtInTemplates.find((template) => template.id === id) ?? null;
}

export const saveSupportTemplate = (template: SupportTemplate) => upsert(SUPPORT_TEMPLATES, template);
