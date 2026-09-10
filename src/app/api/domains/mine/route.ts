import { NextResponse } from "next/server";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { listDomainsForUser } from "@/lib/domains/store";
export async function GET(request: Request) { const caller = await verifyCaller(request); if (!caller) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ domains: await listDomainsForUser(caller.uid) }); }
