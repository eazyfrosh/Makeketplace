import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getAccountForUser, getAllBankingProfiles } from "@/lib/banking/store";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const profiles = (await getAllBankingProfiles()).filter((p) => p.passwordHash);
  const filtered = q
    ? profiles.filter(
        (p) =>
          p.email?.toLowerCase().includes(q) ||
          p.firstName?.toLowerCase().includes(q) ||
          p.lastName?.toLowerCase().includes(q) ||
          p.userId.toLowerCase().includes(q),
      )
    : profiles;

  const users = await Promise.all(
    filtered.map(async (p) => {
      const account = await getAccountForUser(p.userId);
      return {
        userId: p.userId,
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        createdAt: p.createdAt,
        accountStatus: account?.status ?? null,
        balance: account?.balance ?? null,
        currency: account?.currency ?? null,
      };
    }),
  );

  return NextResponse.json({ users: users.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}
