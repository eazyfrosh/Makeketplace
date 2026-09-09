import { getAll, getOne, getWhere, remove, upsert } from "@/lib/services/store";
import type { SupportSite, SupportSiteTicket, SupportTemplate } from "./types";
import { supportTemplates as builtInTemplates } from "./templates";

export const SUPPORT_SITES = "supportSites";
export const SUPPORT_TICKETS = "supportSiteTickets";
export const SUPPORT_TEMPLATES = "supportTemplates";
export const getSupportSite = (id: string) => getOne<SupportSite>(SUPPORT_SITES, id);
export const getUserSupportSites = (userId: string) => getWhere<SupportSite>(SUPPORT_SITES, "userId", userId);
export const getAllSupportSites = () => getAll<SupportSite>(SUPPORT_SITES);
export const saveSupportSite = (site: SupportSite) => upsert(SUPPORT_SITES, { ...site, updatedAt: new Date().toISOString() });
export const deleteSupportSite = (id: string) => remove(SUPPORT_SITES, id);
export async function getPublishedSupportSite(slug: string) {
  const sites = await getWhere<SupportSite>(SUPPORT_SITES, "slug", slug);
  return sites.find((site) => site.status === "published") ?? null;
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
