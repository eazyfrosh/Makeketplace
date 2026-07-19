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
  AI Automation, Graphic Design, Premium Templates, Custom Software Development).
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
