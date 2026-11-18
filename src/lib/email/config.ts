/**
 * EazyTool's preferred Resend variable is namespaced to avoid collisions with
 * other projects sharing the same deployment environment. Keep the original
 * name as a local/backward-compatible fallback.
 */
export function getResendApiKey() {
  return process.env.EAZYTOOL_RESEND_API_KEY || process.env.RESEND_API_KEY || "";
}

export function getEazyToolEmailFrom() {
  return process.env.EMAIL_FROM_EAZYTOOL || process.env.EMAIL_FROM || "EazyTool <onboarding@resend.dev>";
}
