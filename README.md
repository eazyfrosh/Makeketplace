# Nexova — Premium Digital Services Marketplace

A dark, glassmorphic SaaS marketplace for premium digital products and services —
built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, and
hand-wired shadcn/ui components.

This is a standalone project living in `marketplace/` inside the `flightbook` repo,
independent from the SkyBook flight-booking app in the repo root.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4, Framer Motion, shadcn/ui-style components (hand-written, no CLI
  network dependency), lucide-react icons
- Firebase Authentication + Firestore (optional — see below)
- Stripe (real test-mode integration via `@stripe/react-stripe-js`), with Paystack
  and Flutterwave wired up server-side and ready for live keys
- Zustand (cart/wishlist), React Hook Form + Zod, sonner toasts

## Running locally

```bash
cd marketplace
npm install
npm run dev
```

Open http://localhost:3000.

## Demo mode vs. real integrations

Everything works out of the box with **zero configuration**:

- **Auth**: local-demo mode backed by `localStorage`. A seeded demo admin is
  created automatically — `admin@nexova.demo` / `admin123`.
- **Payments**: checkout runs in demo mode (no card is ever charged) and still
  produces a real order, license keys, and dashboard entry.

To enable real integrations, copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_FIREBASE_*` — switches auth/data from localStorage to Firebase
  Auth + Firestore (see `src/lib/firebase/client.ts`, `src/lib/services/store.ts`).
- `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — enables a real
  Stripe test-mode PaymentIntent + Elements flow (`/api/checkout/stripe`).
- `PAYSTACK_SECRET_KEY` / `FLUTTERWAVE_SECRET_KEY` — enables real transaction
  initialization against those APIs (`/api/checkout/paystack`,
  `/api/checkout/flutterwave`); without them, checkout simulates success so the
  flow stays testable end-to-end.

## What's built (first slice)

- **Home** — hero, featured services, why-choose-us, testimonials, CTA.
- **Services** (`/services`) — searchable, filterable grid of all 8 product lines
  (Banking Platform, Airline Booking Platform, Logistics Platform, Website Design,
  AI Automation, Graphic Design, Premium Templates, QR Code Generator).
- **Individual service page** (`/services/[slug]`) — hero, screenshots, features,
  benefits, 3-tier pricing, reviews, FAQ, related services.
- **Checkout** (`/checkout`) — order summary, coupon codes (`LAUNCH10`, `NEXOVA20`),
  Stripe/Paystack/Flutterwave tabs, guest or logged-in checkout.
- **Checkout success** — order confirmation with license keys.
- **Customer dashboard** (`/dashboard`) — purchases, license keys, support tickets,
  account settings.
- **Admin overview** (`/admin`, admin role required) — order table and revenue
  stats. Full catalog CRUD, screenshot uploads, and discount management are
  slated for a follow-up pass.
- **Extras** — wishlist, dark/light theme toggle, newsletter signup, contact page,
  about page, deals page.

## Project structure

```
src/
  app/            Next.js App Router routes
  components/     ui/ (shadcn-style primitives), layout/, home/, marketing/, checkout/, auth/
  context/        Auth context (Firebase/local-demo)
  lib/data/       Mock service catalog, coupons
  lib/services/   Firestore/localStorage data access (orders, support tickets)
  lib/store/      Zustand stores (cart, wishlist)
  lib/stripe/     Stripe client/server helpers
  types/          Shared TypeScript types
```

## Build

```bash
npm run build
npm run lint
```

## Paystack wallet and subscription setup

EazyTool uses two separate Paystack purposes through one signed webhook:

- `wallet_topup` credits the authenticated user's closed-loop wallet only after Paystack verification.
- `subscription` activates EazyTool All Access for one month after a verified one-time Paystack payment.

Configure `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_APP_URL` in Vercel. The
subscription checkout now initializes a Paystack transaction for each customer
with an EazyTool reference and the configured monthly price. Paystack shows
the payment methods enabled for your account, including transfer when available.
The old `PAYSTACK_SUBSCRIPTION_PAYMENT_PAGE_URL` variable is no longer used.
Configure the webhook URL as:

```text
https://YOUR_EAZYTOOL_DOMAIN/api/paystack/webhook
```

Use a test key and test checkout before accepting live payments. The browser callback is
only a progress screen; wallet credit and subscription state are determined by
server-stored payment intents, Paystack signature checks, transaction
verification, exact email/amount/currency matching, and idempotent Firestore
transactions. Access expires one calendar month after the verified payment (or
extends one month from the current expiry when the user pays early); payment is
not automatically renewed.

If an older shared Payment Page transfer succeeded but did not activate access,
open `/admin/subscriptions` and use **Recover a confirmed payment**. Enter the
Paystack transaction reference and the customer's EazyTool account email,
review the verified amount and account, then activate. This action verifies
Paystack again and cannot reuse a wallet, domain, or previously applied payment.

## ResellerClub and automatic email domains

Domain checkout is deliberately disabled until the registrar is fully
configured. The production UI never fabricates availability, registration IDs,
DNS changes, or verified email domains. Add all `RESELLERCLUB_*` values from
`.env.example` to Vercel's Production environment and redeploy. You need the
Reseller ID and API key from **ResellerClub → Settings → API**, a ResellerClub
customer ID, matching registrant/admin/technical/billing contact ID, and at
least two default nameservers. ResellerClub also requires the API caller's IP
to be whitelisted. Because ordinary Vercel Functions do not guarantee a fixed
egress IP, use Vercel Secure Compute/static egress or a fixed-egress proxy before
enabling live registration, then whitelist that IP in ResellerClub.

For safe testing, create a ResellerClub demo reseller account and use its test
credentials with `https://test.httpapi.com`. Never use live credentials against
the test URL: ResellerClub warns that those requests can still affect production.
Automated tests use in-memory provider mocks and never create a real order.

The initial email provider is Resend. Add `RESEND_API_KEY` and
`RESEND_WEBHOOK_SECRET`, and configure the signed webhook at:

```text
https://YOUR_EAZYTOOL_DOMAIN/api/email-flash/webhook
```

After registration, EazyTool adds the domain to Resend, retrieves its SPF,
DKIM, return-path and verification records, adds a conservative DMARC record,
writes them through the registrar provider, and checks verification using the
Vercel cron. The committed schedule runs daily so it deploys on Vercel Hobby;
users can also check immediately from their domain dashboard. On Vercel Pro,
change the schedule to `0 * * * *` for hourly background checks. Sender
identities are outbound-only; replies are delivered
to their configured reply-to address.

Deploy Firestore rules and indexes before enabling the feature:

```bash
firebase deploy --project YOUR_FIREBASE_PROJECT_ID --only firestore:rules,firestore:indexes
```
