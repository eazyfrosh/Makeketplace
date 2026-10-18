# Domain Name API setup for EazyTool

EazyTool uses Domain Name API for **new** registrations. Existing records retain
their `provider` value and continue through their original provider. No automatic
transfer is performed.

## Verified provider details

- Production REST base: `https://api.domainresellerapi.com/api/v1`
- OT&E REST base: `https://ote.domainresellerapi.com/api/v1`
- Authentication headers: `X-API-KEY` and `__reseller`
- Credentials: the Reseller ID shown for your current REST account and its API Key from **Reseller Settings → Integration Details**
- Limits: at most 2 requests/second and a 200-point soft quota per 60 seconds.
- The current v2 platform requires the caller's outbound IP in its allowed-IP list.

Official references:

- https://www.domainnameapi.com/api-integration
- https://www.domainnameapi.com/knowledge-base/modules/how-to-create-domain-name-api-key-step-by-step-guide
- https://www.domainnameapi.com/knowledge-base/domain/domain-api-rate-limit-throttling-bulk-usage-policy

## Vercel variables

Add all server-only variables to the Makeketplace Vercel project. Never prefix
these with `NEXT_PUBLIC_`.

```text
DOMAINNAMEAPI_RESELLER_ID=
DOMAINNAMEAPI_API_KEY=
DOMAINNAMEAPI_ENVIRONMENT=test
DOMAINNAMEAPI_BASE_URL=
DOMAINNAMEAPI_DEFAULT_NAMESERVERS=tr.apiname.com,eu.apiname.com
DOMAIN_USD_NGN_RATE_MINOR=
DOMAIN_PAYMENT_FEE_BPS=200
DOMAIN_PAYMENT_FIXED_FEE_MINOR=0
DOMAIN_PURCHASES_ENABLED=false
DOMAINNAMEAPI_LIVE_OPERATIONS_ENABLED=false
DOMAIN_RENEWALS_ENABLED=false
DOMAIN_TRANSFERS_ENABLED=false
```

Leave `DOMAINNAMEAPI_BASE_URL` empty unless support instructs otherwise. The app
selects the official OT&E or production endpoint from `DOMAINNAMEAPI_ENVIRONMENT`.

## Safe activation sequence

1. Create/activate the reseller account and enable API access.
2. Copy the **test** API key and its matching Reseller ID to Vercel.
3. Keep all operation gates false and redeploy.
4. Open **Admin → Domains** and run the read-only connection test.
5. Exercise availability, registration, duplicate request, timeout, insufficient
   funds, reconciliation and refund tests in OT&E.
6. Obtain a production key. IP allowlisting is mandatory on the current v2 API,
   while normal Vercel serverless egress is not one stable IP. Use Vercel Secure
   Compute/static egress or an authenticated, endpoint-restricted fixed-IP
   connector; allowlist only that outbound IP.
7. Fund the live provider account from its panel using **Deposit** (card, PayPal,
   or bank/wire transfer, where available).
8. Set `DOMAINNAMEAPI_ENVIRONMENT=production`, enter the live key, redeploy, and
   repeat the read-only connection and balance check.
9. Run one controlled registration and verify provider ownership, Firestore order,
   wallet/payment state, expiry, nameservers, and recovery behavior.
10. Enable public registration only after approval by setting both
    `DOMAIN_PURCHASES_ENABLED=true` and
    `DOMAINNAMEAPI_LIVE_OPERATIONS_ENABLED=true`. Renewals and transfers remain
    independently disabled until their own tests pass.

## Pricing and premium domains

`.com` starts at ₦24,000 registration and ₦30,000 renewal. Other extensions are
unavailable until an administrator stores explicit registration, renewal and
transfer prices. Before payment, the server rechecks availability and provider
cost, converts the wholesale quote using the configured USD/NGN rate, estimates
fees, and blocks a loss-making order. Premium domains are never sold at a standard
price.

## DNS note

Domain Name API support confirmed that its managed DNS service uses these
authoritative nameservers:

```text
tr.apiname.com
eu.apiname.com
```

Keep `DOMAINNAMEAPI_DEFAULT_NAMESERVERS` set to those two hosts in Vercel. New
registrations use them automatically. Domains registered earlier with different
nameservers must be updated at the registrar before automatic DNS provisioning
can succeed.

Nameserver management is supported by the provider integration. DNS-record write
operations remain guarded until the account's API Library confirms the DNS-zone
endpoints enabled for this reseller. The app does not guess or simulate DNS writes.
