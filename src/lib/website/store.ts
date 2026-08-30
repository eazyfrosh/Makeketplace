// Mirrors src/lib/banking/store.ts's exact Admin-SDK-or-in-memory pattern,
// under its own collection name. One config document per user (doc id =
// userId) — a licensee edits a single site, not a list of them, today.
import { adminDb } from "@/lib/licensing/admin-db";
import type { WebsiteConfig } from "@/lib/website/types";

const CONFIGS = "websiteConfigs";

declare global {
  var __nexovaWebsiteDemoStore: Map<string, WebsiteConfig> | undefined;
}

function demoStore() {
  if (!global.__nexovaWebsiteDemoStore) {
    global.__nexovaWebsiteDemoStore = new Map();
  }
  return global.__nexovaWebsiteDemoStore;
}

export async function getWebsiteConfig(userId: string): Promise<WebsiteConfig | null> {
  if (adminDb) {
    const snap = await adminDb.collection(CONFIGS).doc(userId).get();
    return snap.exists ? (snap.data() as WebsiteConfig) : null;
  }
  return demoStore().get(userId) ?? null;
}

export async function setWebsiteConfig(config: WebsiteConfig): Promise<void> {
  if (adminDb) {
    await adminDb.collection(CONFIGS).doc(config.userId).set(config);
    return;
  }
  demoStore().set(config.userId, config);
}
