import { NextResponse } from "next/server";

import { listPlans } from "@/lib/subscriptions/store";

export async function GET() {
  return NextResponse.json({ plans: await listPlans() });
}
