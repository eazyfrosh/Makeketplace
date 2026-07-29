import { NextResponse } from "next/server";

import { getOrderById, getLicenseById } from "@/lib/licensing/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || (order.userId !== caller.uid && caller.role !== "admin")) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const licenses = await Promise.all(order.licenseIds.map((licenseId) => getLicenseById(licenseId)));

  return NextResponse.json({
    order: { id: order.id, totalCents: order.totalCents, createdAt: order.createdAt, email: order.email },
    licenses: licenses
      .filter((l): l is NonNullable<typeof l> => l !== null)
      .map((l) => ({
        serviceSlug: l.serviceSlug,
        serviceName: l.serviceName,
        licenseKey: l.licenseKey,
        status: l.status,
        expiresAt: l.expiresAt,
      })),
  });
}
