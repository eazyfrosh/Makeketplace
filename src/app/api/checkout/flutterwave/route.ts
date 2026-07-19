import { NextResponse } from "next/server";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const amountCents = Number(body?.amountCents);
  const email = String(body?.email ?? "");

  if (!amountCents || amountCents < 50 || !email) {
    return NextResponse.json({ error: "Invalid amount or email." }, { status: 400 });
  }

  if (!FLUTTERWAVE_SECRET_KEY) {
    return NextResponse.json(
      {
        demo: true,
        message:
          "Flutterwave is not configured on this deployment. Set FLUTTERWAVE_SECRET_KEY to enable real transactions.",
      },
      { status: 200 },
    );
  }

  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: `nexova-${Date.now()}`,
        amount: (amountCents / 100).toFixed(2),
        currency: "USD",
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/success`,
        customer: { email },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message ?? "Flutterwave error." }, { status: 502 });
    }
    return NextResponse.json({ demo: false, paymentLink: data.data.link });
  } catch {
    return NextResponse.json({ error: "Failed to reach Flutterwave." }, { status: 502 });
  }
}
