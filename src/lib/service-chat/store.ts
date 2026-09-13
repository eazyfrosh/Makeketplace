import { adminDb } from "@/lib/licensing/admin-db";
import { defaultServiceChatSettings, type ChatEnabledService, type ServiceChatSettings } from "./types";

const COLLECTION = "serviceChatSettings";
declare global { var __eazytoolsServiceChatSettings: Map<string, ServiceChatSettings> | undefined; }
const memory = () => global.__eazytoolsServiceChatSettings ??= new Map<string, ServiceChatSettings>();
const key = (userId: string, serviceSlug: ChatEnabledService) => `${userId}_${serviceSlug}`;

export async function getServiceChatSettings(userId: string, serviceSlug: ChatEnabledService) {
  const id = key(userId, serviceSlug);
  if (adminDb) {
    const snapshot = await adminDb.collection(COLLECTION).doc(id).get();
    return snapshot.exists ? snapshot.data() as ServiceChatSettings : defaultServiceChatSettings(userId, serviceSlug);
  }
  return memory().get(id) ?? defaultServiceChatSettings(userId, serviceSlug);
}

export async function saveServiceChatSettings(settings: ServiceChatSettings) {
  const id = key(settings.userId, settings.serviceSlug);
  if (adminDb) await adminDb.collection(COLLECTION).doc(id).set(settings);
  else memory().set(id, settings);
}
