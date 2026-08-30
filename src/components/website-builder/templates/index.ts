import type { ComponentType } from "react";

import { DefaultTemplate } from "@/components/website-builder/templates/default-template";
import type { WebsiteConfig } from "@/lib/website/types";

/**
 * Add a new designed template here as `{ id: Component }` — WebsiteConfig
 * already stores a `templateId`, so a new entry is the only change needed
 * to make it selectable. Falls back to "default" for any unknown id (e.g.
 * a template that's since been removed from the registry).
 */
export const templates: Record<string, ComponentType<{ config: WebsiteConfig }>> = {
  default: DefaultTemplate,
};

export const templateOptions: { id: string; label: string }[] = [{ id: "default", label: "Default" }];

export function getTemplate(templateId: string): ComponentType<{ config: WebsiteConfig }> {
  return templates[templateId] ?? templates.default;
}
