import { NextResponse } from "next/server";

import { getLicenseById, getValidationLogsForLicense } from "@/lib/licensing/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const license = await getLicenseById(id);
  if (!license) return NextResponse.json({ error: "License not found." }, { status: 404 });
  if (license.userId !== caller.uid && caller.role !== "admin") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const history = caller.role === "admin" ? await getValidationLogsForLicense(id) : [];

  return NextResponse.json({ license, history });
}
