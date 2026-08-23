**ALAS CLOTHING**

**E-Commerce  
Technical Stack & Architecture**

A simple, fast, interactive and scalable web platform for a local clothing brand.

```text
ALAS E-Commerce
Next.js 16 + TypeScript
↓
Supabase
├─ PostgreSQL
├─ Authentication
├─ Storage
└─ Realtime
↓
PayMongo
├─ QR Ph
├─ Maya
├─ GCash*
├─ Cards*
└─ Online Banking
```

Version 1.0 • 21 August 2026

**Primary design principle**

**Keep the commerce core simple. Add complexity only when ALAS has a proven need for it.**

# 1. Architecture Overview

ALAS E-Commerce will use a **single modern Next.js application** for the customer-facing storefront and server-side application logic. Supabase provides the managed data platform, while PayMongo handles online payments.

- Fast storefront experience with server rendering, caching, optimized navigation and responsive UI.

- Simple backend architecture without maintaining a separate API server during the initial stage.

- Relational PostgreSQL data model suited to products, variants, orders, inventory and payments.

- Built-in authentication, file storage and realtime capabilities through Supabase.

- PayMongo integration for Philippine payment methods, with payment availability depending on the merchant account and activated channels.

- Ready for interactive features such as animated product pages and a future 3D shirt viewer.

| **GOAL** | **Premium clothing-brand experience without enterprise-level infrastructure overhead.** |
|----------|-----------------------------------------------------------------------------------------|

# 2. Technology Stack

| **Layer**             | **Technology**          | **Responsibility**                                                                      |
|-----------------------|-------------------------|-----------------------------------------------------------------------------------------|
| Application Framework | **Next.js 16**          | Storefront, server rendering, routing, APIs/server actions and commerce logic.          |
| Language              | **TypeScript**          | Type-safe frontend and backend development.                                             |
| UI Layer              | **React**               | Reusable components and interactive product experiences.                                |
| Database              | **Supabase PostgreSQL** | Products, variants, customers, carts, orders, inventory, payments and business data.    |
| Authentication        | **Supabase Auth**       | Customer and administrator sign-in, sessions and account management.                    |
| File Storage          | **Supabase Storage**    | Product photos, lookbook assets, receipts and other media.                              |
| Realtime              | **Supabase Realtime**   | Optional live inventory/order/admin updates where they provide value.                   |
| Payments              | **PayMongo**            | QR Ph, Maya, GCash\*, Cards\* and Online Banking based on enabled account capabilities. |

\* Availability depends on PayMongo onboarding, account verification and payment-channel activation. The application must treat available methods as configuration, not hard-coded assumptions.

# 3. Next.js 16 + TypeScript

## Role in ALAS

Next.js is the main application framework. It should own both the customer storefront and the initial server-side business logic so ALAS does not need a separate backend service during the MVP stage.

- Storefront pages: Home, Collections, Product Detail, Cart, Checkout, Account and Order Tracking.

- Admin pages: Products, Inventory, Orders, Customers, Discounts and payment status.

- Server-side validation and secure operations that must never run only in the browser.

- PayMongo payment creation, webhook processing and order-status updates.

- Supabase access through server-side clients for privileged operations.

## Recommended UI additions

| **Library**                      | **Use**                                                                                             |
|----------------------------------|-----------------------------------------------------------------------------------------------------|
| **Tailwind CSS**                 | Fast, consistent responsive styling.                                                                |
| **shadcn/ui**                    | Accessible component foundation without locking ALAS into a heavy UI framework.                     |
| **Motion**                       | Smooth product/cart/page micro-interactions.                                                        |
| **React Three Fiber + Three.js** | Optional 3D garment viewer and product interaction later.                                           |
| **Zod**                          | Shared validation for forms and server-side input.                                                  |
| **Zustand**                      | Small client-side state where URL/server state is not enough, such as a cart drawer or 3D controls. |

# 4. Supabase Platform

## PostgreSQL

PostgreSQL is the system of record. E-commerce data is strongly relational, so orders, order items, product variants, stock, customers and payments should be modeled with foreign keys and transactional rules rather than as unrelated documents.

products  
product_variants  
product_images  
inventory  
customers  
addresses  
carts / cart_items  
orders / order_items  
payments  
payment_events  
shipments  
discounts

| **Service**  | **Initial Use**                                      | **Rule**                                                                    |
|--------------|------------------------------------------------------|-----------------------------------------------------------------------------|
| **Auth**     | Customer accounts and admin authentication.          | Apply role checks server-side; do not trust UI visibility as authorization. |
| **Storage**  | Product media and optional payment/supporting files. | Use controlled buckets and optimized public assets for storefront media.    |
| **Realtime** | Selected order/inventory/admin updates.              | Use only where live updates improve UX; avoid subscribing to everything.    |

# 5. PayMongo Payment Architecture

PayMongo is the payment provider. The application should create payment/check-out sessions from trusted server-side code and update payment/order state from verified webhook events, not from the browser redirect alone.

1.  Customer confirms items, shipping details and final amount in checkout.

2.  Next.js validates price, stock and order data on the server.

3.  The server creates the pending ALAS order and requests the corresponding PayMongo payment flow.

4.  Customer completes payment using an enabled method such as QR Ph, Maya, GCash\*, Cards\* or Online Banking.

5.  PayMongo sends a webhook event to the ALAS server endpoint.

6.  ALAS verifies the event, records the payment event and updates the order to Paid only when the authoritative payment status is confirmed.

**Cart → Checkout → Pending Order → PayMongo → Webhook → Paid Order → Fulfillment**

> Payment rules
> • Never mark an order Paid only because the customer returned to a success page.
> • Store PayMongo IDs/statuses needed for reconciliation and support.
> • Make webhook handling idempotent so duplicate events do not duplicate stock or payment actions.
> • Keep payment methods configurable because channel availability can change by merchant account.

# 6. Core Architecture Decisions

**One application first —** Do not create a separate Laravel/Node/FastAPI backend unless a real scaling, integration or organizational need appears.

**PostgreSQL over MongoDB —** Commerce data depends heavily on relations, constraints, inventory consistency and transactions.

**Server authority —** Pricing, stock checks, discounts, payment creation and privileged writes are validated on the server.

**Managed services —** Use Supabase and PayMongo to reduce infrastructure and operational burden for a small brand.

**Progressive interactivity —** Keep core shopping usable and fast; load animation/3D features only on pages that need them.

**Configuration over hard-coding —** Payment methods, shipping rules, sizes and product options should be data/config-driven.

# 7. Suggested Project Structure

alas-ecommerce/  
├── app/  
│ ├── (store)/  
│ │ ├── page.tsx  
│ │ ├── collections/  
│ │ ├── products/\[slug\]/  
│ │ ├── cart/  
│ │ └── checkout/  
│ ├── account/  
│ ├── admin/  
│ └── api/  
│ └── webhooks/paymongo/  
├── components/  
│ ├── commerce/  
│ ├── ui/  
│ └── three/  
├── lib/  
│ ├── supabase/  
│ ├── paymongo/  
│ ├── validation/  
│ └── auth/  
├── types/  
├── public/  
└── supabase/  
├── migrations/  
└── seed.sql

**Rule: keep payment logic, privileged database operations and secret keys out of client components.**

# 8. Performance & Interactive Experience

- Use Next.js server rendering/static generation where appropriate for storefront and collection pages.

- Optimize product images and serve responsive image sizes instead of full-resolution originals everywhere.

- Lazy-load heavy features such as the 3D shirt viewer.

- Keep animations short and purposeful; avoid blocking scrolling or navigation.

- Use caching for product/catalog reads while ensuring inventory and checkout validations use fresh server-side data.

- Prefer server data fetching and small client components instead of turning the entire storefront into a client-rendered application.

# 9. Environment & Security Rules

| **Area**            | **Rule**                                                                                                               |
|---------------------|------------------------------------------------------------------------------------------------------------------------|
| **Secrets**         | SUPABASE service credentials and PayMongo secret keys must stay server-only and must never use NEXT_PUBLIC\_ prefixes. |
| **Database access** | Enable Row Level Security where applicable and use explicit server authorization for administrator actions.            |
| **Payments**        | Verify webhook authenticity according to PayMongo integration requirements and make event processing idempotent.       |
| **Validation**      | Validate all checkout, product/admin and webhook payloads before database writes.                                      |
| **Inventory**       | Re-check available stock during checkout/order creation; do not trust stale client cart state.                         |
| **Auditability**    | Keep timestamps and payment/order history so issues can be traced without manually guessing what happened.             |

# 10. Recommended MVP Scope

## Phase 1 — Commerce Core

- Product catalog with size/color variants

- Inventory tracking

- Cart and checkout

- PayMongo payment flow

- Order management

- Basic admin area

## Phase 2 — Brand Experience

- Collections/lookbook

- Smooth transitions and micro-interactions

- Customer accounts and order history

- Discount/promo features

- Improved analytics

## Phase 3 — Interactive Product

- 3D garment viewer

- Front/back design preview

- Optional measurement-driven model controls

- Advanced media and product storytelling

# 11. Final Target

**ALAS should begin as a focused commerce application, not a collection of services.** Next.js + TypeScript provides the application, Supabase provides the data platform, and PayMongo provides payments. This keeps development fast today while leaving room for richer 3D product experiences, mobile/PWA features, additional integrations and higher scale later.

| **NEXT.JS 16 + TYPESCRIPT → SUPABASE → PAYMONGO** |
|---------------------------------------------------|
