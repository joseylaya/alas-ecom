# PayMongo Dynamic QR Ph operations

This document records the implemented ALAS QR Ph architecture. The normative requirements remain in `PAYMONGO_LIVE_QRPH_IMPLEMENTATION.md`.

## Architecture

ALAS E-Commerce is the customer UI and a same-origin proxy. ALAS Management is the commerce and payment authority backed by the production PostgreSQL database. The browser never receives a PayMongo secret and never supplies the authoritative amount.

1. Next.js sends customer data and variant IDs/quantities to ALAS Management.
2. Laravel locks inventory, revalidates the selected expiring shipping quote, recalculates product subtotal plus shipping, creates an idempotent local order, and reserves live stock once.
3. For live checkout, Laravel confirms the account exposes `qrph`, creates a Payment Intent, creates a `qrph` Payment Method, and attaches it.
4. Next.js displays only the returned Dynamic QR image, order reference, amount, and expiry.
5. A signed PayMongo webhook finalizes payment. The UI polls local order truth and performs controlled server-side reconciliation every 30 seconds.

The original PayMongo Checkout Session sandbox path remains available and does not deduct stock.

## ALAS Management environment variables

Required names (values belong only in the deployment secret store):

```text
PAYMONGO_MODE
PAYMONGO_TEST_PUBLIC_KEY
PAYMONGO_TEST_SECRET_KEY
PAYMONGO_LIVE_PUBLIC_KEY
PAYMONGO_LIVE_SECRET_KEY
PAYMONGO_TEST_WEBHOOK_SECRET
PAYMONGO_LIVE_WEBHOOK_SECRET
PAYMONGO_WEBHOOK_TOLERANCE
PAYMONGO_API_URL
PAYMONGO_SUCCESS_URL
PAYMONGO_CANCEL_URL
STOREFRONT_SANDBOX_ENABLED
STOREFRONT_SANDBOX_TOKEN
```

`PAYMONGO_MODE=live` enables live checkout. The service rejects a key whose prefix does not match the requested mode. Never prefix a secret with `NEXT_PUBLIC_`.

## ALAS E-Commerce environment variables

```text
ALAS_MANAGEMENT_URL
COMMERCE_MODE
ALAS_SANDBOX_TOKEN
PAYMONGO_SANDBOX_FLOW
NEXT_PUBLIC_APP_URL
```

Use `COMMERCE_MODE=sandbox` with `PAYMONGO_SANDBOX_FLOW=qrph` locally/staging to generate Dynamic QR Ph using test credentials. Set `PAYMONGO_SANDBOX_FLOW=checkout_session` only when explicitly testing the preserved legacy hosted checkout. Use `COMMERCE_MODE=live` only for the production storefront after capability preflight succeeds.

## Capability preflight

Run on the Laravel server without printing the secret:

```bash
php artisan paymongo:check-qrph
```

The command must report that live QR Ph is available before enabling live checkout. If it does not, keep `PAYMONGO_MODE=test` and complete PayMongo activation/KYC or contact PayMongo. Do not bypass the capability check.

## PayMongo Dashboard setup

In Live mode, create one HTTPS webhook endpoint:

```text
https://jmgaming.site/api/v1/webhooks/paymongo
```

Subscribe only to:

```text
payment.paid
payment.failed
qrph.expired
```

Store the live signing secret as `PAYMONGO_LIVE_WEBHOOK_SECRET`. Configure the equivalent test endpoint/secret for sandbox verification.

## Database rollout

Run Laravel migrations before enabling live checkout. The QR Ph migration adds payment-method, QR expiry/attempt, safe error-state, and webhook-order trace fields. It is additive and preserves existing orders.

## Troubleshooting

- `QRPH_UNAVAILABLE`: verify `PAYMONGO_MODE=live`, the live secret-key prefix, account activation, and `php artisan paymongo:check-qrph`.
- `QRPH_CREATION_FAILED`: inspect the server log using the order reference; never log Authorization headers or secrets.
- QR expired: the order remains unpaid. The customer can generate a new QR from the private order link.
- Customer paid but UI remains pending: inspect webhook delivery, then use the private order page or reconciliation endpoint. Reconciliation retrieves the Payment Intent and applies the same idempotent finalization.
- Webhook 401: confirm the correct test/live signing secret and server clock.
- Webhook 422: inspect the recorded failed event for amount, currency, order, or environment mismatch.

## Controlled live acceptance test

After test-mode acceptance passes, use a low-value legitimate production order that meets PayMongo's minimum. Confirm the live Payment Intent, scannable QR, Dashboard payment, successful webhook, one webhook-event record, one paid transition, one stock reservation, refresh recovery, and harmless webhook redelivery.

Production is not considered ready until this controlled real-money test succeeds.
