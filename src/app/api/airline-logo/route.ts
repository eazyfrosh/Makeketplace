import { NextRequest, NextResponse } from "next/server";

const AIRLINE_DOMAINS = new Set([
  "aa.com",
  "airfrance.com",
  "britishairways.com",
  "cathaypacific.com",
  "delta.com",
  "emirates.com",
  "etihad.com",
  "jal.co.jp",
  "klm.com",
  "lufthansa.com",
  "qatarairways.com",
  "singaporeair.com",
  "turkishairlines.com",
  "united.com",
  "virginatlantic.com",
]);

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.toLowerCase();
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

  if (!domain || !AIRLINE_DOMAINS.has(domain) || !token) {
    return new NextResponse(null, { status: 404 });
  }

  const params = new URLSearchParams({
    token,
    size: "128",
    format: "png",
    fallback: "404",
    retina: "true",
  });
  const response = await fetch(`https://img.logo.dev/${domain}?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24 * 7 },
  });
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || !contentType.startsWith("image/")) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
