# TikTok Pixel setup for EazyTool

Pixel ID: `DBCURCBC77U4J2JQ9R50`. Add these **public** build-time variables in the **Makeketplace** Vercel project, for Production (and Preview only if you intend to test there), then redeploy:

```text
NEXT_PUBLIC_TIKTOK_PIXEL_ID=DBCURCBC77U4J2JQ9R50
NEXT_PUBLIC_TIKTOK_PRIVACY_REVIEWED=true
```

Keep `NEXT_PUBLIC_TIKTOK_PRIVACY_REVIEWED=false` until the TikTok-side privacy review below is complete. The pixel will not load until both variables are set correctly **and** the visitor separately accepts **Marketing** in EazyTool's Cookie settings. Existing Google Analytics consent does not grant marketing consent. Withdrawing marketing consent calls TikTok's `revokeConsent`, stops EazyTool's event calls, and removes accessible first-party TikTok cookies. The third-party script may remain in an already-open tab; a page reload removes it. Previously sent data cannot be withdrawn from TikTok by this control.

## TikTok Events Manager privacy review (required before enabling)

In **TikTok Ads Manager → Tools → Events → Data sources → this Pixel → Settings**:

1. Turn **Automatic Advanced Matching** off. TikTok says it can inspect form fields and visible text for names, email addresses, phone numbers, addresses, and IDs; EazyTool intentionally supplies none of these.
2. Turn **Enhance Data Postback**, **Auto Event Setup**, and any **Event Builder** rules or automatic button/URL events off for this pixel. These can add collection beyond EazyTool's three explicit event types and can capture page content or unsafe URLs. Review every existing rule before enabling the gate.
3. Check that no other TikTok Pixel tag for this ID is injected by GTM, Vercel, a plugin, or custom HTML. One base code and one event source prevents duplicates.
4. Review TikTok's privacy and data-sharing settings for your region and your site's privacy notice. Pixel requests necessarily convey standard browser information such as IP address and user agent; the code does not manually add identifiers.

Only after completing these steps, set `NEXT_PUBLIC_TIKTOK_PRIVACY_REVIEWED=true` and redeploy. This gate documents the operator's review; it cannot inspect or lock TikTok dashboard settings, so keep them off.

## Events and safeguards

| Action | TikTok event | When it fires | Parameters |
| --- | --- | --- | --- |
| Approved public page visit | `Pageview` | Initial visit and each safe client-side navigation after marketing consent | No custom parameters |
| Pricing viewed | `ViewContent` | Once per consented `/pricing` visit, including client-side navigation | None |
| Checkout started | `InitiateCheckout` | Only after the authenticated subscription initialization endpoint returns a valid checkout reference and URL | None |
| Registration | `CompleteRegistration` | Only after `signup()` succeeds | None |
| Subscription purchase | `Purchase` | Only after `/api/subscriptions/activate` verifies Paystack payment and returns a paid server record | `value` in major NGN units; `currency: NGN` |

The official base script is installed once using Next.js `Script`, only after marketing consent. TikTok's automatic SPA history observer is disabled (`historyObserver: false`), and EazyTool deduplicates manual page views and pricing `ViewContent`. Pixel loading and manual events are restricted to fixed public routes with no unsafe URL parameters. Private account, wallet, domain, and dashboard routes are not sent to TikTok. A visible **Cookie preferences** button lets visitors change Marketing consent without scrolling to the footer. The Paystack callback URL contains a payment reference, so the pixel never loads there; the verified purchase is queued in memory and sent from the clean `/subscription/confirmed` page. If the browser closes before that page loads, no browser conversion is sent. Firestore/Paystack remain the source of truth.

Purchase references are used only to create a browser-local deduplication key, never as TikTok event parameters. A reload or duplicate callback cannot send the same browser purchase twice. No names, emails, phone numbers, plan labels, form contents, or raw payment references are passed in event calls. TikTok can still collect its own standard browser/device information; inspect actual payloads in Events Manager before advertising.

## Verify

1. Open the website in a fresh browser profile. Before choosing cookies, Network should show no request to `analytics.tiktok.com`.
2. Save choices with **Marketing** off: still no TikTok script or event. Then enable **Marketing** via the visible **Cookie preferences** button or the footer **Cookie settings** link.
3. In **TikTok Events Manager → Data sources → Pixel → Test events**, use a public EazyTool page. Confirm one `Pageview` for the initial page and one per public client-side navigation, plus one `ViewContent` on `/pricing`. After a real checkout initialization succeeds, expect one `InitiateCheckout`; do not complete a charge merely to test the pixel. TikTok Pixel Helper can show duplicate tags or errors. Check event payloads for unsafe URLs and identifiers.
4. Create a fictional test account only if you have a safe test environment; expect `CompleteRegistration` only after success. Do **not** create a real paid subscription merely to test the pixel. For an existing verified purchase callback, expect one `Purchase` with `value: 35000` and `currency: NGN` for a ₦35,000 payment, not `3500000` kobo. Verify the amount against the actual server payment record.
5. Withdraw Marketing consent. Future public navigation must send no TikTok events. Re-open Cookie settings to opt in again if desired.

Official references: [TikTok standard events](https://ads.tiktok.com/resources/help/article/standard-events-parameters), [pixel base code](https://ads.tiktok.com/gateway/docs/index?doc_id=1701890973258754), [SPA pageview behavior](https://ads.tiktok.com/resources/help/article/about-single-page-application-pageview-measurement-for-tiktok-pixel), [pixel consent mode](https://business-api.tiktok.com/portal/docs/pixel-cookie-consent-mode/v1.3), [Automatic Advanced Matching](https://ads.tiktok.com/help/article/how-to-set-up-automatic-advanced-matching), [Events Manager testing](https://ads.tiktok.com/resources/help/article/about-tiktok-events-manager).
