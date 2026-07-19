import { NextResponse } from "next/server";

import { isStripeConfigured, stripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const amountCents = Number(body?.amountCents);

  if (!amountCents || amountCents < 50) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  if (!isStripeConfigured || !stripe) {
    return NextResponse.json(
      {
        demo: true,
        message:
          "Stripe is not configured on this deployment. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable real test-mode payments.",
      },
      { status: 200 },
    );
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ demo: false, clientSecret: intent.client_secret });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment intent." },
      { status: 500 },
    );
  }
}
