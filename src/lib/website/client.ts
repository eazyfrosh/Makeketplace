"use client";

import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { WebsiteConfig } from "@/lib/website/types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...headers, ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export function getWebsiteConfig(): Promise<{ config: WebsiteConfig; isNew?: boolean }> {
  return api("/api/website/config");
}

export function saveWebsiteConfig(input: {
  siteName: string;
  tagline?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  brandColor?: string;
  templateId?: string;
}): Promise<{ config: WebsiteConfig }> {
  return api("/api/website/config", { method: "PATCH", body: JSON.stringify(input) });
}
