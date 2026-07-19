import { getWhere, upsert } from "@/lib/services/store";
import type { SupportTicket } from "@/types";

const TICKETS_COLLECTION = "supportTickets";

export async function getTicketsForUser(userId: string): Promise<SupportTicket[]> {
  return getWhere<SupportTicket>(TICKETS_COLLECTION, "userId", userId);
}

export async function createTicket(params: {
  userId: string;
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  const ticket: SupportTicket = {
    id: `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: params.userId,
    subject: params.subject,
    message: params.message,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  await upsert(TICKETS_COLLECTION, ticket);
  return ticket;
}
