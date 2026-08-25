# ALAS E-Commerce

Customer-facing ALAS storefront. Copy `.env.example` to `.env.local`, set `ALAS_MANAGEMENT_URL` to the deployed management application, then run `npm install` and `npm run dev`.

The catalog is read from ALAS Management's public storefront API and revalidates every 30 seconds. A local fixture is used only when the management URL is not configured or the API is temporarily unavailable. `/api/checkout/validate` re-reads the authoritative management catalog before accepting cart prices and stock.

Dynamic QR Ph payment requirements and operations are documented in [`app-documentation/PAYMONGO_LIVE_QRPH_IMPLEMENTATION.md`](app-documentation/PAYMONGO_LIVE_QRPH_IMPLEMENTATION.md) and [`app-documentation/PAYMONGO_QRPH_OPERATIONS.md`](app-documentation/PAYMONGO_QRPH_OPERATIONS.md). PayMongo secret keys and webhook signing secrets live only in ALAS Management's server environment.
