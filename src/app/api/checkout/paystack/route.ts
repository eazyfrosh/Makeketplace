import { NextResponse } from "next/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const amountCents = Number(body?.amountCents);
  const email = String(body?.email ?? "");

  if (!amountCents || amountCents < 50 || !email) {
    return NextResponse.json({ error: "Invalid amount or email." }, { status: 400 });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      {
        demo: true,
        message:
          "Paystack is not configured on this deployment. Set PAYSTACK_SECRET_KEY to enable real transactions.",
      },
      { status: 200 },
    );
  }

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountCents),
        currency: "NGN",
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/callback?provider=paystack`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message ?? "Paystack error." }, { status: 502 });
    }
    return NextResponse.json({ demo: false, authorizationUrl: data.data.authorization_url });
  } catch {
    return NextResponse.json({ error: "Failed to reach Paystack." }, { status: 502 });
  }
}
