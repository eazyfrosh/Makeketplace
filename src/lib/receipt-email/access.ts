import "server-only";

import { resolveServiceAccess } from "@/lib/licensing/service-access";
import type { AuthenticatedCaller } from "@/lib/licensing/verify-auth";

export async function requireReceiptEmailAccess(caller: AuthenticatedCaller) {
  const access = await resolveServiceAccess(caller.uid, caller.role, "email-designer", ["email-flash"]);
  if (!access.allowed) throw new Error("ACTIVE_SUBSCRIPTION_REQUIRED");
}
