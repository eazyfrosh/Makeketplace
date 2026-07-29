import { NextResponse } from "next/server";

import { getAllOrders } from "@/lib/licensing/store";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const orders = await getAllOrders();
  return NextResponse.json({
    orders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}
