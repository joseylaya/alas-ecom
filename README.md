# ALAS E-Commerce

Customer-facing ALAS storefront. Copy `.env.example` to `.env.local`, add Supabase public credentials, then run `npm install` and `npm run dev`.

The catalog currently uses a local development fixture until Supabase is configured; `/api/checkout/validate` is the server authority boundary and must be switched to database reads before launch.
