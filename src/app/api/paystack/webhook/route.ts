import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDomainOrderByReference } from "@/lib/domains/store";
import { registerPaidDomain } from "@/lib/domains/service";
import { sanitizeRegistrant } from "@/types/domains";
const secret = process.env.PAYSTACK_SECRET_KEY;
export async function POST(request: Request) { const raw = await request.text(); if (secret) { const signature = request.headers.get("x-paystack-signature") ?? ""; const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex"); if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: "Invalid signature." }, { status: 401 }); } const payload = JSON.parse(raw) as { event?: string; data?: { reference?: string; status?: string; metadata?: { userId?: string; orderId?: string; domain?: string } } }; if (payload.event !== "charge.success" || payload.data?.status !== "success" || !payload.data.reference) return NextResponse.json({ received: true }); const order = await getDomainOrderByReference(payload.data.reference); if (!order || order.paymentStatus === "paid") return NextResponse.json({ received: true }); await registerPaidDomain(payload.data.reference, order.userId, sanitizeRegistrant({ email: "", name: "Paystack customer" })); return NextResponse.json({ received: true }); }
