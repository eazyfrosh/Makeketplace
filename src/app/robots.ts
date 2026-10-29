import type { MetadataRoute } from "next";

const siteUrl = "https://www.eazytool.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
        "/admin",
        "/auth",
        "/dashboard",
        "/platform",
        "/wallet",
        "/checkout",
        "/subscription",
        "/access",
        "/verify-boarding-pass",
        "/track-shipment",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
