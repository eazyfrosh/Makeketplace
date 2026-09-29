const FRIENDLY_ERRORS: Array<[RegExp, string]> = [
  [/failed_precondition|requires an index/i, "This area is still being prepared. Please try again shortly."],
  [/permission[-_ ]denied|missing or insufficient permissions/i, "You do not have permission to complete this action. Try signing in again."],
  [/network|fetch failed|unreachable/i, "We could not connect right now. Check your internet connection and try again."],
  [/provider_not_configured|not configured/i, "This service is being configured. Please try again later."],
  [/unauthenticated|invalid token|auth/i, "Your session has expired. Please sign in again."],
];

export function userFacingError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const replacement = FRIENDLY_ERRORS.find(([pattern]) => pattern.test(message));
  if (replacement) return replacement[1];
  if (!message || /\b(stack|firebase|firestore|grpc|api key)\b/i.test(message)) return fallback;
  return message;
}
