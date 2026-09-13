export const CHAT_ENABLED_SERVICES = ["airline-booking-platform", "logistics-platform"] as const;
export type ChatEnabledService = (typeof CHAT_ENABLED_SERVICES)[number];

export interface ServiceChatSettings {
  userId: string;
  serviceSlug: ChatEnabledService;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  telegramEnabled: boolean;
  telegramUrl: string;
  liveChatEnabled: boolean;
  liveChatEmbedCode: string;
  updatedAt: string;
}

export function defaultServiceChatSettings(userId: string, serviceSlug: ChatEnabledService): ServiceChatSettings {
  return { userId, serviceSlug, whatsappEnabled: false, whatsappNumber: "", telegramEnabled: false, telegramUrl: "", liveChatEnabled: false, liveChatEmbedCode: "", updatedAt: new Date().toISOString() };
}
