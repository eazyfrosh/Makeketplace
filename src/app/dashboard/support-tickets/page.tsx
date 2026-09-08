"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { getOwnerSupportTickets } from "@/lib/support-sites/store";
import type { SupportSiteTicket } from "@/lib/support-sites/types";
export default function TicketsPage(){const {user,loading}=useAuth();const router=useRouter();const [tickets,setTickets]=useState<SupportSiteTicket[]>([]);useEffect(()=>{if(!loading&&!user)router.replace("/auth/login");if(user)getOwnerSupportTickets(user.uid).then(setTickets)},[user,loading,router]);return <main className="mx-auto max-w-6xl px-4 py-14"><h1 className="text-3xl font-semibold">Support Tickets</h1><p className="mt-2 text-muted-foreground">Legitimate customer requests submitted through your published sites.</p><div className="mt-8 space-y-4">{tickets.map(ticket=><article key={ticket.id} className="glass rounded-2xl p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold">{ticket.subject}</h2><p className="text-sm text-muted-foreground">{ticket.name} · {ticket.email} · {ticket.category}</p></div><Badge>{ticket.status}</Badge></div><p className="mt-4 whitespace-pre-wrap text-sm">{ticket.message}</p></article>)}{!tickets.length&&!loading&&<div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">No tickets yet.</div>}</div></main>}
