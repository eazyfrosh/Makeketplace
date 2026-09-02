import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getAllShipments } from "@/lib/logistics/store";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const shipments = await getAllShipments();
  return NextResponse.json({
    shipments: shipments.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}
