**ALAS**

E-Commerce User Experience  
& Checkout Specification

Guest-first shopping • Persistent cart • Frictionless checkout • PayMongo payments

| **ALAS Storefront** Next.js 16 + TypeScript                               |
|---------------------------------------------------------------------------|
| **Guest Cart** Zustand + browser localStorage                             |
| **Commerce Data** Supabase PostgreSQL + Auth + Storage + Realtime         |
| **Payments** PayMongo Hosted Checkout V2                                  |
| **Security** Server validation + Supabase RLS + verified payment webhooks |

Status: Development planning specification

Version: 1.0

Date: August 21, 2026

Reference direction: Deadways storefront / minimal Shopify-style checkout patterns, adapted for ALAS.

# Contents

1\. Product Vision and UX Principles

2\. End-to-End Customer Journey

3\. Guest Shopping and Persistent Cart

4\. Product and Add-to-Cart Experience

5\. Checkout Experience

6\. Payment and PayMongo Integration

7\. Orders, Inventory and Reservation Rules

8\. Customer Accounts and Guest Order Tracking

9\. Pages and Mobile-First UI

10\. Data Model and Application Architecture

11\. Security, Validation and Privacy

12\. Performance and Interaction Guidelines

13\. Development Phases

14\. Acceptance Criteria

15\. Sources and References

> Primary experience goal
> A customer must be able to discover a product, choose a variant, add it to cart, checkout, and pay without being forced to create an account or understand the technical system behind the store.

# 1. Product Vision and UX Principles

ALAS E-Commerce should feel like a modern clothing brand storefront rather than a traditional business system. Shopping actions must be obvious, fast, mobile-friendly, and forgiving of refreshes, accidental navigation, failed payments, and customers who do not want an account.

| **Principle**           | **Rule**                                                                                                      |
|-------------------------|---------------------------------------------------------------------------------------------------------------|
| Guest-first commerce    | Browsing, cart usage, checkout, payment, and order tracking must work without login.                          |
| Minimal decisions       | Only show choices that are relevant at the current step. Avoid crowded forms and unnecessary account prompts. |
| Instant feedback        | Adding, removing, and changing cart quantities should update immediately without a page reload.               |
| Never lose intent       | A browser refresh, navigation, or failed payment must not silently erase the customer cart.                   |
| Server is authoritative | Product price, stock, discounts, shipping fees, and payment state are never trusted from browser storage.     |
| Mobile first            | Primary flows must be designed for customers arriving from social platforms on phones.                        |
| Progressive enhancement | 3D, animation, accounts, wishlists, and advanced features come after the commerce path is reliable.           |

# 2. End-to-End Customer Journey

HOME → SHOP / COLLECTION → PRODUCT → SELECT VARIANT → ADD TO CART  
→ CART DRAWER / CART PAGE → CHECKOUT → CUSTOMER DETAILS  
→ SHIPPING → CREATE ORDER → PAYMONGO → PAYMENT WEBHOOK  
→ ORDER CONFIRMED → TRACK ORDER

The recommended flow intentionally delays personal information collection until the customer has already decided to checkout. Account creation is never part of the required purchase path.

| **Stage**        | **Interface**                                          | **Customer goal**                                                          |
|------------------|--------------------------------------------------------|----------------------------------------------------------------------------|
| Discovery        | Home, Shop, Collections, Search                        | Find a product quickly.                                                    |
| Product decision | Images, color, size, quantity, size guide, optional 3D | Understand the product and select a valid variant.                         |
| Cart             | Drawer or cart page                                    | Review products, quantities and subtotal without leaving shopping context. |
| Checkout         | Contact and delivery details                           | Collect only information needed to fulfill the order.                      |
| Shipping         | Shipping option and fee                                | Show a clear cost before payment.                                          |
| Payment          | PayMongo Hosted Checkout                               | Use only payment methods available to the merchant.                        |
| Confirmation     | Order number and summary                               | Make payment/order status obvious.                                         |
| After purchase   | Guest tracking or optional account                     | Allow tracking without forcing signup.                                     |

# 3. Guest Shopping and Persistent Cart

## 3.1 Recommended implementation

Use Zustand for in-memory cart state and persist the guest cart to browser localStorage. Redis is not required for the first version because the cart belongs to a single browser and does not need server-side session infrastructure just to survive refreshes.

Next.js UI  
↓  
Zustand cart store  
↓  
localStorage key: alas_cart_v1

## 3.2 What may be stored locally

- variant_id — required server identifier

- quantity — requested amount

- product_name, size, color, image — presentation cache only

- display_price — presentation cache only; never authoritative

- version and updated_at — migration and expiry support

> Security rule
> Never calculate the final payable amount from localStorage. A user can modify browser storage. The server must re-fetch product variants, price, stock, discounts, and shipping rules before an order or payment session is created.

## 3.3 Persistence behavior

| **Event**                            | **Expected behavior**                     |
|--------------------------------------|-------------------------------------------|
| Refresh page                         | Cart remains                              |
| Navigate to another page             | Cart remains                              |
| Close and reopen browser             | Cart remains                              |
| Return later on same browser/profile | Cart remains until expiry or manual clear |
| Payment fails                        | Cart remains                              |
| Customer presses Back                | Cart remains                              |
| Confirmed paid order                 | Cart is cleared after server confirmation |

Recommended stale-cart policy: 30 days from the last cart change. This is a persistence policy only; it is not an inventory reservation.

# 4. Product and Add-to-Cart Experience

The product page should make variant selection obvious and prevent invalid actions before they happen.

ALAS PRODUCT  
₱899  
  
Color: ● Black ○ White  
Size: S M L XL XXL  
Quantity: − 1 +  
  
\[ ADD TO CART \]

- Sold-out sizes are visibly disabled and cannot be selected.

- Add to Cart does not reload or navigate away.

- After adding, show immediate feedback such as “Added to cart”.

- Open a compact cart drawer with product, variant, quantity, subtotal, Checkout, and Continue Shopping.

- Changing quantity updates Zustand and localStorage immediately.

- Do not perform a database write for each guest cart click.

- Product 3D is optional and lazy-loaded only when the customer requests it.

## 4.1 Cart drawer

The cart drawer is a convenience layer, not a separate checkout process. It should be small enough to preserve shopping context and should always include one obvious primary action: Checkout.

# 5. Checkout Experience

## 5.1 Start checkout with server validation

localStorage cart  
↓  
POST /api/checkout/validate  
↓  
Next.js server  
↓  
Supabase PostgreSQL  
↓  
Validated price + stock + shipping eligibility

If stock changed, the interface should correct the quantity and explain the change in customer language. Example: “Only 1 Large is left. Your quantity was updated from 2 to 1.”

## 5.2 Customer information

Ask only for information required to contact the customer and deliver the order.

| **Section** | **Fields**                                                                                                       |
|-------------|------------------------------------------------------------------------------------------------------------------|
| Contact     | Email address, mobile number                                                                                     |
| Recipient   | Full name                                                                                                        |
| Delivery    | Country (default Philippines), Region, Province, City/Municipality, Barangay, Street/House/Building, Postal Code |
| Shipping    | Available shipping option and calculated fee                                                                     |

> Do not ask for a password
> Guest checkout must continue without account creation, email verification, or password setup. “Already have an account? Log in” can be a secondary link, never a gate.

## 5.3 Checkout layout

Desktop may use a two-column layout: customer/shipping form on the left and a sticky order summary on the right. Mobile should use a single column, concise sections, large inputs, and a persistent primary action where appropriate.

## 5.4 Shipping cost transparency

Show the shipping fee as soon as the address is specific enough to calculate it. Do not hide a known fee until the final payment screen.

# 6. Payment and PayMongo Integration

For the initial implementation, use PayMongo Hosted Checkout V2. The backend creates a checkout session, the customer is redirected to PayMongo, and ALAS confirms payment using a webhook rather than trusting the browser redirect.

Checkout details validated  
↓  
Create ALAS order (pending payment)  
↓  
Create PayMongo /v2/checkout_sessions  
↓  
Redirect customer to PayMongo  
↓  
Customer pays  
↓  
PayMongo webhook → ALAS  
↓  
Verify event + order reference  
↓  
payment_status = PAID  
order_status = PAID / PROCESSING  
↓  
Clear cart + show confirmation

## 6.1 Payment methods

The UI should display only methods that are currently enabled for the ALAS PayMongo account. The planned labels may include QR Ph, Maya, GCash, cards, and online banking, but availability is a merchant capability and must not be assumed or hardcoded.

## 6.2 Webhook authority

> Never mark an order paid just because the browser reached /checkout/success
> The return page can be opened directly or reached without a successful settlement. The payment state must be updated from a verified PayMongo webhook/event or an equivalent server-side verification step.

## 6.3 Failure behavior

- Payment cancelled → order remains pending/expired according to policy; cart remains.

- Payment failed → show a retry path; cart remains.

- PayMongo temporarily unavailable → keep the cart and provide a clear retry message.

- Duplicate webhook → handler must be idempotent; do not duplicate stock deduction or payment records.

# 7. Orders, Inventory and Reservation Rules

## 7.1 Order statuses

| **Status**      | **Meaning**                                    |
|-----------------|------------------------------------------------|
| PENDING_PAYMENT | Order created; waiting for successful payment. |
| PAID            | Payment confirmed by server.                   |
| PROCESSING      | ALAS is preparing the order.                   |
| PACKED          | Packed and ready for dispatch.                 |
| SHIPPED         | Handed to delivery/courier.                    |
| DELIVERED       | Delivery completed.                            |
| CANCELLED       | Order intentionally cancelled.                 |
| PAYMENT_FAILED  | Payment attempt failed.                        |
| REFUNDED        | Payment refunded.                              |

## 7.2 Inventory reservation

Adding to cart must not reserve stock. Otherwise abandoned carts can block real buyers. A short reservation may begin only when payment is being initiated or an order is created for payment.

ADD TO CART → no reservation  
CHECKOUT VALIDATION → availability check  
PAYMENT INITIATED → optional short reservation  
PAYMENT CONFIRMED → commit stock movement  
RESERVATION EXPIRES / PAYMENT FAILS → release reservation

Initial reservations can live in PostgreSQL. Redis is not required for this phase.

# 8. Customer Accounts and Guest Order Tracking

## 8.1 Optional accounts

Accounts are a convenience feature, not a checkout requirement. Offer account creation after purchase with a clear benefit such as faster checkout, saved addresses, and order history.

## 8.2 Guest-to-account cart merge

If a guest logs in after adding products, merge the guest cart with the authenticated cart. Duplicate variants should combine quantities subject to current stock.

## 8.3 Guest order tracking

A guest must be able to track an order without an account. Use an order number plus email/phone verification or a secure tracking token delivered in the confirmation message.

Order \#ALAS-000148  
● Order confirmed  
● Payment received  
● Processing  
○ Packed  
○ Shipped  
○ Delivered

# 9. Pages and Mobile-First UI

Launch with a small set of high-value pages. Avoid adding navigation complexity before the purchase flow is proven.

| **Route**             | **Purpose**               |
|-----------------------|---------------------------|
| /                     | Home                      |
| /shop                 | Shop all                  |
| /collections/\[slug\] | Collection                |
| /products/\[slug\]    | Product                   |
| /cart                 | Cart                      |
| /checkout             | Guest checkout            |
| /checkout/success     | Order confirmation        |
| /orders/track         | Guest order tracking      |
| /login                | Optional login            |
| /account              | Optional customer account |

## 9.1 Home page

- Hero / current drop with one primary Shop action

- Latest drop

- Best sellers

- Short ALAS brand statement

- Lookbook / lifestyle imagery

- Social links or social content

## 9.2 Mobile product page

Keep price, selected variant, and Add to Cart easy to reach. A sticky bottom CTA is appropriate after the customer has selected a valid size/variant.

# 10. Data Model and Application Architecture

CUSTOMER BROWSER  
├─ Next.js 16 + TypeScript  
├─ Zustand  
└─ localStorage (guest cart only)  
│  
▼  
NEXT.JS SERVER  
├─ cart validation  
├─ checkout / shipping calculation  
├─ PayMongo session creation  
└─ PayMongo webhook handler  
│  
▼  
SUPABASE  
├─ PostgreSQL  
├─ Auth  
├─ Storage  
└─ Realtime  
│  
└────────── PAYMONGO

## 10.1 Proposed tables

| **Table**              | **Purpose**                                         |
|------------------------|-----------------------------------------------------|
| products               | Base product information                            |
| product_variants       | Size/color/SKU/price variant                        |
| product_images         | Product media metadata                              |
| inventory              | Available/committed stock by variant                |
| collections            | Merchandising groups                                |
| collection_products    | Product-to-collection mapping                       |
| profiles               | Optional authenticated customer profile             |
| addresses              | Saved addresses for authenticated customers         |
| orders                 | Order header and customer/shipping snapshot         |
| order_items            | Immutable product/price snapshot per purchase       |
| payments               | Provider IDs, amount, status and timestamps         |
| order_status_history   | Audit trail of order state changes                  |
| inventory_reservations | Temporary stock reservation while payment is active |
| shipping_methods       | Shipping service/rate rules                         |
| discounts              | Promotion definition                                |

## 10.2 Order snapshot rule

Order items must store the purchased product name, variant labels, quantity, and unit price as a snapshot. Historical orders must not change when a product is renamed or repriced later.

# 11. Security, Validation and Privacy

| **Control**          | **Requirement**                                                                      |
|----------------------|--------------------------------------------------------------------------------------|
| Server-side pricing  | Re-query authoritative product/variant pricing before order creation.                |
| Stock validation     | Re-check available quantity at checkout and payment initiation.                      |
| RLS                  | Enable Row Level Security on exposed Supabase tables and grant least privilege.      |
| Secrets              | PayMongo secret keys and Supabase service/secret keys remain server-only.            |
| Storage policies     | Use Storage RLS/policies for upload and private file access where needed.            |
| Webhook verification | Verify PayMongo webhook authenticity and make handlers idempotent.                   |
| PII minimization     | Do not persist checkout email, phone, or complete address in localStorage.           |
| Logs                 | Avoid logging full payment credentials or unnecessary personal data.                 |
| Rate limits          | Protect checkout creation, tracking lookups, login, and webhook endpoints as needed. |

# 12. Performance and Interaction Guidelines

- Use Next.js image optimization and responsive image sizes for product media.

- Lazy-load 3D assets, heavy galleries, and non-critical scripts.

- Use skeleton states for network-bound product/checkout validation rather than blank screens.

- Keep cart actions local-first and instant; validate on checkout instead of writing every click to the database.

- Avoid animation that delays navigation, Add to Cart, form input, or payment.

- Keep mobile tap targets large and maintain visible selected states for size/color.

- Use optimistic UI only where failure is easy to recover from; payment/order status is never optimistic.

- Preload only critical storefront assets; do not preload large GLB files globally.

# 13. Development Phases

| **Phase** | **Area**                | **Deliverable**                                                          |
|-----------|-------------------------|--------------------------------------------------------------------------|
| 1         | Commerce foundation     | Product schema, variants, collections, inventory, Supabase security.     |
| 2         | Storefront              | Home, Shop, Collection, Product pages; responsive product media.         |
| 3         | Guest cart              | Zustand cart, localStorage persistence, expiry/versioning.               |
| 4         | Cart UX                 | Cart drawer, cart page, quantity controls, stock-aware UI.               |
| 5         | Guest checkout          | Cart revalidation, customer/address form, order summary.                 |
| 6         | Shipping                | Rate calculation and transparent shipping selection.                     |
| 7         | Orders                  | Order creation, order item snapshots, status history, reservation logic. |
| 8         | PayMongo                | Hosted Checkout V2, redirects, test-mode integration.                    |
| 9         | Payment reliability     | Webhook verification, idempotency, failure/retry handling.               |
| 10        | Confirmation & tracking | Success page, guest tracking, notifications.                             |
| 11        | Optional accounts       | Supabase Auth, saved addresses, order history, cart merge.               |
| 12        | Admin                   | Product, inventory, order and fulfillment management.                    |
| 13        | 3D viewer               | React Three Fiber / Three.js viewer, lazy-loaded product models.         |
| 14        | Enhancements            | Discounts, wishlist, reviews, recommendation features as justified.      |

> Build order rule
> Do not prioritize login, wishlist, rewards, AI recommendations, or 3D before Shop → Cart → Checkout → Pay → Order is reliable. That flow is the commerce engine for the entire site.

# 14. Acceptance Criteria

- A guest can add a valid variant to cart without logging in.

- The cart survives refresh, route navigation, and browser reopen on the same profile.

- Add to Cart and quantity changes do not reload the page.

- Checkout revalidates all variants, prices, and quantities on the server.

- Invalid or changed stock is explained in customer-friendly language and the cart is corrected safely.

- Checkout asks only for contact, recipient, delivery, shipping, and payment information required to fulfill the order.

- Account creation is optional and never blocks purchase.

- Final payable totals are calculated using server-authoritative data.

- An order is not marked paid from a client redirect alone.

- PayMongo webhook handling is verified and idempotent.

- Failed/cancelled payment does not erase the guest cart.

- Cart is cleared only after confirmed successful payment/order completion policy.

- Adding to cart does not reserve inventory.

- Guest orders can be tracked without account creation.

- Product 3D does not block initial product page rendering.

- Primary checkout and cart experiences are usable on common mobile widths.

# 15. Sources and References

Implementation references used for this specification:

**Deadways:** https://deadways.com/ — storefront and minimal clothing-commerce UX reference supplied for ALAS.

**PayMongo Hosted Checkout:** https://docs.paymongo.com/docs/payment-channels-hosted-checkout — Checkout Session architecture and /v2 recommendation for new integrations.

**PayMongo Hosted Checkout Quick Start:** https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start — backend session creation, redirect, and webhook confirmation flow.

**PayMongo Webhooks:** https://docs.paymongo.com/reference/webhook-resource — checkout/payment event and webhook resource behavior.

**Supabase Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security — RLS requirements for exposed tables.

**Supabase Storage Access Control:** https://supabase.com/docs/guides/storage/security/access-control — Storage RLS/access policy guidance.

**Supabase Data Security:** https://supabase.com/docs/guides/database/secure-data — publishable vs secret/service credentials and least-privilege guidance.

**End of specification**
