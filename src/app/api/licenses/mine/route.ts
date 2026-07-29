import { NextResponse } from "next/server";

import { getLicensesForUser, getOrdersForUser } from "@/lib/licensing/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [licenses, orders] = await Promise.all([
    getLicensesForUser(caller.uid),
    getOrdersForUser(caller.uid),
  ]);

  const orderById = new Map(orders.map((o) => [o.id, o]));

  return NextResponse.json({
    licenses: licenses
      .map((l) => ({
        id: l.id,
        licenseKey: l.licenseKey,
        serviceSlug: l.serviceSlug,
        serviceName: l.serviceName,
        status: l.status,
        billing: l.billing,
        issuedAt: l.issuedAt,
        expiresAt: l.expiresAt,
        orderId: l.orderId,
        orderTotalCents: orderById.get(l.orderId)?.totalCents ?? null,
      }))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
  });
}
