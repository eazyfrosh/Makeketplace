import { getAll, getOne, getWhere, remove, upsert } from "@/lib/services/store";
import type { SupportSite, SupportSiteTicket } from "./types";

export const SUPPORT_SITES = "supportSites";
export const SUPPORT_TICKETS = "supportSiteTickets";
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
