# ALAS checkout shipping operations

This document records the implemented J&T Express and Maxim Delivery foundation. The normative requirements remain in `ALAS E-Commerce — Automated J&T + Maxim Delivery Implementation Prompt.md`.

## Architecture

ALAS E-Commerce collects a structured Philippine delivery address and proxies requests. ALAS Management is authoritative for product data, parcel weight, service-area eligibility, quote creation, quote expiry, order totals, and the amount sent to PayMongo.

```text
Checkout → POST /api/shipping/quotes → Laravel ShippingService
                                      ├─ JntShippingProvider
                                      └─ MaximShippingProvider
                                                ↓
                                  normalized, persisted quote ID
                                                ↓
Checkout → selected quote ID → server revalidation → order + PayMongo total
```

The browser never supplies a trusted shipping amount. A quote is tied to a guest session UUID, normalized destination hash, cart hash, provider, fee, and expiry. Address or cart changes require another quote. At checkout Laravel rechecks expiry, ownership, cart/address hashes, provider availability, and the current configured rate before creating the order.

## Database configuration

Migration `2026_08_25_000002_add_storefront_shipping_foundation.php` adds:

- product weight and optional package dimensions;
- `delivery_provider_settings` for enabled state, mode, origin, fallback rates, defaults, distance limit, TTL, and delivery estimate;
- `delivery_service_areas` for structured Maxim country/province/city eligibility and configured city coordinates;
- `shipping_quotes` for expiring guest-session quotes;
- order subtotal, shipping amount, provider/service, quote reference/source, status, tracking fields, and immutable address snapshot.

The migration inserts the ALAS Clothing origin at Lynch Street, Alaska Mambaling, Candido Padilla Street, Mambaling, Cebu City 6000, using the mapped vicinity coordinates `10.2897916, 123.8830930`. It also inserts initial configured-rate values and Cebu City, Mandaue City, and Lapu-Lapu City as enabled Maxim areas. These are operational configuration, not claims of provider API pricing. Confirm the pin on an actual map/device and review enabled cities and fees before production use.

Products without `weight_grams` use the provider setting `default_weight_grams`. Administrators should populate real product weights for accurate J&T estimates.

## Eligibility and rates

J&T is offered only when the normalized country is Philippines/PH and the provider is enabled. Configured-rate mode uses the database base/minimum fee plus the database per-kilogram charge.

Maxim requires an enabled exact normalized match across country, province, and city/municipality in `delivery_service_areas`. It does not use substring checks. When customer coordinates are absent, the configured service-area coordinates are used for an estimate. Haversine distance from the configured store origin drives the database base-distance/per-kilometer calculation, subject to the configured maximum distance.

Both responses use `quote_source=configured_rate`. The checkout labels them as estimated rates.

## External integration status

- **J&T API:** external integration pending. Required: approved merchant/business API access, official current API documentation, credentials, customer code, service codes, and confirmed quotation/shipment/tracking rules.
- **Maxim API:** external integration pending. Required: approved business/API access, official current API documentation, credentials, quotation/booking coverage, and webhook/status rules.
- No courier booking is created after payment yet. The order model is prepared for idempotent future booking/tracking, but production booking must not be enabled until business rules and provider credentials are confirmed.

No new environment variables are required in configured-rate mode. Future API modes must use server-only secrets and must not expose credentials to ALAS E-Commerce.

## Fail-safe behavior

- Incomplete addresses do not request quotes.
- Unsupported Maxim destinations are returned unavailable and hidden by checkout.
- Provider-disabled/API-mode-without-integration states produce no selectable fake quote.
- Expired or mismatched quotes block checkout with a review message.
- Cart/address changes invalidate the selected quote in the UI and are independently rejected by Laravel.
- PayMongo receives `subtotal + validated shipping`; the client cannot override it.
- Repeated checkout submissions retain the existing order idempotency behavior.

## Production checklist

1. Run Laravel migrations.
2. Confirm the seeded Mambaling fulfillment pin using a GPS-enabled phone at the pickup door.
3. Review provider enabled states and every configured rate.
4. Review Maxim service areas and coordinates.
5. Populate product weights.
6. Complete sandbox Cebu, Mandaue, Manila, address-change, cart-change, expiry, and amount-tampering tests.
7. Confirm the PayMongo Payment Intent amount equals the order subtotal plus validated shipping.
8. Keep courier booking disabled until official provider access is approved and implemented.

## Guest tracking email

Storefront checkout keeps one private UUID tracking token per order. When a real mail transport is configured, Laravel emails the customer a one-time order-tracking link and records `tracking_email_sent_at` so idempotent checkout retries do not send duplicates. The public-token page exposes only customer-safe order data: payment and fulfillment state, item snapshots, subtotal/shipping/total, courier/service, normalized shipping status, tracking number/link when recorded, and last update. It does not expose email, phone, or the delivery-address snapshot.

Required production mail configuration:

```text
STOREFRONT_URL
MAIL_MAILER
MAIL_FROM_ADDRESS
MAIL_FROM_NAME
```

Plus the selected mail provider's server-only credentials. `MAIL_MAILER=log` is development-only and deliberately does not mark an email as sent. `STOREFRONT_URL` must be the public HTTPS customer storefront so the emailed `/orders/{token}` link opens the correct application.
