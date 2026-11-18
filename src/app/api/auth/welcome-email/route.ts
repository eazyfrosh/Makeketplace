import { NextResponse } from "next/server";
import { renderWelcomeEmail } from "@/lib/email/welcome-template";
import { getEazyToolEmailFrom } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { verifyCaller } from "@/lib/licensing/verify-auth";

function cleanName(value: unknown, email: string) {
  const name = typeof value === "string" ? value.trim().replace(/[\r\n]/g, "").slice(0, 120) : "";
  return name || email.split("@")[0] || "there";
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(caller.email)) {
    return NextResponse.json({ error: "You must be signed in with a valid email address." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  const email = renderWelcomeEmail({
    name: cleanName(body?.name, caller.email),
    dashboardUrl: `${origin}/dashboard`,
    pricingUrl: `${origin}/pricing`,
    logoUrl: `${origin}/eazytools-logo-light.png`,
  });

  try {
    const result = await sendEmail({
      to: caller.email,
      from: getEazyToolEmailFrom(),
      subject: email.subject,
      html: email.html,
      text: email.text,
      idempotencyKey: `welcome-email-${caller.uid}`,
    });
    return NextResponse.json({ sent: true, provider: result.provider }, { status: 202 });
  } catch (error) {
    console.error("[auth/welcome-email] Could not send welcome email", {
      uid: caller.uid,
      reason: error instanceof Error ? error.message : "unknown",
    });
    // Account creation has already succeeded. Do not turn a temporary email
    // provider problem into a failed signup.
    return NextResponse.json({ sent: false, error: "Welcome email could not be sent right now." }, { status: 202 });
  }
}
