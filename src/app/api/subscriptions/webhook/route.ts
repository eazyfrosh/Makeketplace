// Backward-compatible alias for deployments that previously configured the
// subscription-only endpoint. New Paystack setups should use /api/paystack/webhook.
import { POST as handlePaystackWebhook } from "@/app/api/paystack/webhook/route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handlePaystackWebhook(request);
}
