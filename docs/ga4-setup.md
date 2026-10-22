# EazyTool Google Analytics 4 setup

## Deployment

In the **Makeketplace / EazyTool Vercel project**, add `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-X7HVGP5ZR2` for Production (and Preview only if you want preview traffic in the same GA4 property), then redeploy. The measurement ID is public; no Analytics secret is needed. The tag does not load until a visitor chooses **Allow analytics**. Visitors can change the choice using **Cookie settings** in the footer.

The official `@next/third-parties` package is installed. Its `GoogleAnalytics` component always queues an automatic configuration page view and does not expose a `send_page_view: false` option. EazyTool therefore loads the same Google tag with Next.js `Script` after consent and sends controlled page views: URLs are stripped of payment references, email addresses, customer domain names and other dynamic route values. Only the approved `utm_source` values `snapchat`, `instagram`, `facebook`, and `google`, and approved `utm_medium` values, are retained. Do not put personal information in UTM parameters.

The page sets Google's consent defaults to **denied** synchronously before the tag can load. After a visitor accepts analytics, EazyTool updates consent to granted for analytics only, configures `G-X7HVGP5ZR2`, and waits for the tag's ready callback before sending one manual page view. Rejecting consent keeps collection disabled.

## Required GA4 data-stream settings

In **Google Analytics → Admin → Data streams → EazyTool web stream → Enhanced measurement**, turn **off** “Page changes based on browser history events” under Page views. EazyTool sends exactly one sanitized page view per client-side route change. Leaving Google's automatic history page views enabled can create duplicates and may collect unsanitized URLs. For the strictest privacy configuration, turn off the other Enhanced measurement events that EazyTool does not use (such as form interactions and outbound clicks). Keep Google's email and URL-query data redaction enabled as an additional safeguard.

EazyTool sends these custom events only after consent:

| Event | When it fires | Parameters sent |
| --- | --- | --- |
| `sign_up` | Registration succeeds | `method=password` |
| `login` | Login succeeds | `method=password` |
| `subscription_plan_selected` | Subscribe is clicked | A validated plan ID |
| `subscription_purchase` | Server confirms subscription activation | A validated plan ID |
| `service_used` | A permitted tool opens | An allowlisted service slug |
| `domain_purchase` | Server confirms a registered domain | Extension only |

Payment references are used **only in the browser's local deduplication key**. They, payment amounts, email addresses, account IDs, and full domain names are never event parameters. Purchase events are not emitted on payment-page redirects or pending orders. If a Paystack webhook confirms a payment while the browser is closed, GA4 will not receive a client event; the application database remains the source of truth for revenue.

After the first test events arrive, mark `subscription_purchase` and `domain_purchase` as **key events** in GA4 if you want them in conversion reports. Remove any older EazyTool GA/GTM snippet or Vercel-injected Analytics tag for this same measurement ID to prevent duplicate collection.

## Campaign links

Use tagged links such as:

- `https://eazytool.app/?utm_source=snapchat&utm_medium=paid_social`
- `https://eazytool.app/?utm_source=instagram&utm_medium=social`
- `https://eazytool.app/?utm_source=facebook&utm_medium=paid_social`
- `https://eazytool.app/?utm_source=google&utm_medium=cpc`

GA4 uses the sanitized landing-page UTM values for attribution. Unknown UTM sources and arbitrary campaign text are discarded to avoid accidental personal-data collection.

## Verification

1. Open EazyTool in a fresh private browser window. Before consent, confirm there are **no** requests to `googletagmanager.com` or `google-analytics.com` in the browser Network panel.
2. Choose **Allow analytics**. Confirm that the Google tag loads and a `page_view` appears in **GA4 → Reports → Realtime**. Navigate to another EazyTool page without a full refresh; it should produce one more `page_view`.
3. Use [Google Tag Assistant](https://tagassistant.google.com/) on your own browser, then open **GA4 → Admin → DebugView** to inspect the page views and test events. DebugView requires consent and debug mode; Tag Assistant supplies debug mode without enabling it for every visitor.
4. Test a tagged campaign link and check Realtime's source/medium, then later the Traffic acquisition report. Verify that a callback URL containing `reference=` appears only as a sanitized path in event parameters.
5. Check **Cookie settings → Reject analytics**. Further page changes must stop Analytics requests; the site's ordinary features should continue to work.

If Realtime stays at zero, first verify that the selected GA4 property is **digitalservices-2793e** and its web stream measurement ID is `G-X7HVGP5ZR2`. Other properties in the same Analytics account use different IDs and will not show EazyTool visits. Next, accept analytics in a normal browser without an ad blocker and inspect the browser Network panel for a `g/collect` request to `google-analytics.com` after opening and navigating EazyTool. Google Tag Assistant should show the denied default consent state, a granted analytics update after acceptance, and one `page_view` hit per page. A `200` response for `gtag/js` alone does not prove that a collection hit was sent. Realtime may take a short time to update; the site's consent choice and browser blocking remain decisive.

Before production use, review EazyTool's privacy notice and consent design with the privacy requirements that apply to your customers and operating regions. GA4 reporting is supplementary; use EazyTool's server records to reconcile subscription and domain purchases.
