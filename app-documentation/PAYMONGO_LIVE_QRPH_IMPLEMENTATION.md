# PayMongo Live QR Ph Payment Gateway Implementation

> **Status:** Implementation Specification / AI Development Prompt  
> **Target:** Production launch using PayMongo Dynamic QR Ph  
> **Primary constraint:** Launch using the PayMongo **Individual** account path without requiring DTI registration or BIR Certificate of Registration (Form 2303) for this QR Ph-only phase.  
> **Last verified against PayMongo documentation:** August 25, 2026

---

## 1. PRIMARY OBJECTIVE — READ THIS FIRST

The main goal of this implementation is to move the application's existing PayMongo integration from **sandbox-only** into a safe **real/live production payment flow using Dynamic QR Ph**.

The business does **not yet have DTI registration or a BIR Certificate of Registration (Form 2303)**.

This phase must therefore target the PayMongo capability that is currently eligible for an **Individual account**:

- ✅ Dynamic QR Ph
- ✅ Real production transactions
- ✅ Customers may scan the QR using participating QR Ph apps such as GCash, Maya, and supported Philippine banking apps
- ✅ Production PayMongo webhooks
- ✅ Automatic order/payment reconciliation
- ✅ Existing sandbox/test flow must remain available

This phase must **NOT** require or attempt to activate:

- ❌ Direct GCash checkout
- ❌ Visa / Mastercard
- ❌ Google Pay
- ❌ Any payment method that requires business verification beyond the current account
- ❌ DTI registration as a technical launch blocker
- ❌ BIR Form 2303 as a technical launch blocker
- ❌ Sole Proprietor conversion as a technical launch blocker

According to PayMongo's current account capability documentation, **QR Ph is eligible for Individual accounts, including Individuals with a website, and is activated automatically once the account itself is activated**.

This is **not** an instruction to bypass PayMongo verification. The account must still satisfy PayMongo's identity/account activation requirements.

---

## 2. ABSOLUTE RULES FOR THE AI / DEVELOPER

Before writing or modifying code:

1. Read all relevant files under `app-documentation/`.
2. Treat `app-documentation/` as the canonical source of truth.
3. Audit the existing PayMongo sandbox integration before implementing anything.
4. Preserve existing architecture unless a change is required for safe production QR Ph support.
5. Do not rebuild the entire payment system if an existing implementation can be extended.
6. Do not modify unrelated features.
7. Do not remove or break sandbox/test mode.
8. Do not hardcode any PayMongo keys or webhook secrets.
9. Never expose `sk_test_*`, `sk_live_*`, or webhook signing secrets to client-side code.
10. Never trust the frontend as the authority for order totals or payment success.
11. Never mark an order `paid` based only on a browser redirect or frontend state.
12. Never attempt to bypass PayMongo account restrictions.
13. If PayMongo's live capability API does not return `qrph`, stop the live rollout and clearly report the account-side blocker.
14. Make the smallest safe changes required to achieve production QR Ph.
15. Update the relevant `app-documentation/` files after implementation so documentation does not become stale.

---

# 3. CURRENT BUSINESS / ACCOUNT ASSUMPTIONS

Assume:

- The application already has PayMongo integrated in sandbox/test mode.
- The PayMongo Dashboard exposes both test and live API keys.
- The business does not yet have DTI/BIR business registration documents.
- The intended PayMongo account path for this launch is Individual.
- The website will be publicly accessible over HTTPS in production.
- The application uses a server-capable Next.js deployment.
- Supabase is used for application/database persistence.
- Existing cart, checkout, orders, inventory, and customer flows must be preserved.

### Important clarification about live keys

The presence of:

```text
pk_live_...
sk_live_...
```

does **not by itself prove that the account is already activated for real payments**.

PayMongo currently provides test and live keys to accounts upon signup.

Therefore, production readiness must be verified by **capability/account status**, not merely by the existence of live keys.

---

# 4. REQUIRED PRE-FLIGHT CHECK — DO THIS BEFORE MODIFYING PRODUCTION FLOW

The AI/developer must first audit the application and then verify the intended live capability.

## 4.1 Audit existing code

Locate and document:

- PayMongo API/service files
- checkout/payment API routes
- payment UI components
- current PayMongo environment variables
- current test/sandbox key usage
- webhook endpoint(s)
- order database schema
- payment database schema if present
- order status model
- payment status model
- stock deduction timing
- cart clearing timing
- success/cancel pages
- any polling logic
- any existing idempotency handling
- any existing payment reference fields

Before changing code, output a brief audit summary:

```text
Existing PayMongo integration:
- ...
- ...

Reusable:
- ...
- ...

Required changes:
- ...
- ...
```

Do not duplicate functionality that already exists.

---

## 4.2 Verify live QR Ph capability

Using the PayMongo **live secret key on the server only**, check:

```http
GET https://api.paymongo.com/v1/merchants/capabilities/payment_methods
```

Authenticate using the live secret key.

Expected production capability should include:

```json
[
  "qrph"
]
```

The exact returned array may contain additional payment methods. The requirement is simply that:

```text
qrph
```

is present.

### If `qrph` is present

Continue with the production implementation.

### If `qrph` is NOT present

Do not create a workaround.

Do not fake a successful production integration.

Do not substitute test mode.

Report clearly:

> The application can be prepared for production QR Ph, but the PayMongo live account currently does not expose the `qrph` capability. Complete the required PayMongo account activation/KYC step or contact PayMongo before attempting real transactions.

---

# 5. TARGET ARCHITECTURE

The intended production flow is:

```text
Customer
   ↓
Cart
   ↓
Checkout
   ↓
Server validates cart/order
   ↓
Create local order: pending_payment
   ↓
Server creates PayMongo Payment Intent
   ↓
Server creates QR Ph Payment Method
   ↓
Attach Payment Method to Payment Intent
   ↓
PayMongo returns Dynamic QR Ph
   ↓
Frontend displays QR
   ↓
Customer scans with GCash / Maya / supported QR Ph app
   ↓
PayMongo processes real payment
   ↓
PayMongo webhook → application server
   ↓
Verify PayMongo signature
   ↓
Validate event + amount + currency + order
   ↓
Database transaction
   ↓
Payment = paid
Order = appropriate paid/confirmed state
Inventory/ledger side-effects = once only
   ↓
Frontend receives confirmed status
   ↓
Customer sees payment success
```

---

# 6. PAYMENT METHOD FOR THIS PHASE

Use:

```text
qrph
```

Use **Dynamic QR Ph**, not a reusable static store QR.

Dynamic QR Ph is appropriate because:

- each QR is linked to a specific checkout/payment intent;
- the amount is encoded by the payment flow;
- it is single-use;
- PayMongo currently documents a default expiration of approximately 30 minutes if unpaid;
- confirmation can be received automatically through webhook events.

Do not make customers manually:

- type the order amount;
- upload a payment screenshot as the primary verification mechanism;
- wait for staff to manually mark orders as paid.

---

# 7. ENVIRONMENT / SECRETS DESIGN

Reuse existing environment-variable naming conventions when they are already established.

If no clean convention exists, use an equivalent structure:

```env
PAYMONGO_MODE=test

PAYMONGO_TEST_PUBLIC_KEY=
PAYMONGO_TEST_SECRET_KEY=

PAYMONGO_LIVE_PUBLIC_KEY=
PAYMONGO_LIVE_SECRET_KEY=

PAYMONGO_TEST_WEBHOOK_SECRET=
PAYMONGO_LIVE_WEBHOOK_SECRET=

NEXT_PUBLIC_APP_URL=
```

A safer alternative is environment-specific deployment variables where production contains only production credentials and local/dev contains only test credentials.

Example:

### `.env.local`

```env
PAYMONGO_MODE=test
PAYMONGO_SECRET_KEY=sk_test_xxx
PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_WEBHOOK_SECRET=whsk_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production hosting environment

```env
PAYMONGO_MODE=live
PAYMONGO_SECRET_KEY=sk_live_xxx
PAYMONGO_PUBLIC_KEY=pk_live_xxx
PAYMONGO_WEBHOOK_SECRET=whsk_xxx
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

Choose the approach most consistent with the existing project.

## Security requirements

The following must never reach browser bundles:

```text
PAYMONGO_SECRET_KEY
PAYMONGO_TEST_SECRET_KEY
PAYMONGO_LIVE_SECRET_KEY
PAYMONGO_WEBHOOK_SECRET
PAYMONGO_TEST_WEBHOOK_SECRET
PAYMONGO_LIVE_WEBHOOK_SECRET
```

Never prefix secret variables with:

```text
NEXT_PUBLIC_
```

Do not log their values.

Do not commit them.

Confirm `.env*` files containing secrets are covered appropriately by `.gitignore`.

If any live secret has ever been committed or publicly exposed, **rotate it immediately** before launch.

---

# 8. SERVER-SIDE PAYMENT SERVICE

Create or extend a dedicated PayMongo service/module rather than scattering PayMongo HTTP calls throughout components.

Conceptual structure:

```text
lib/
  payments/
    paymongo/
      client.ts
      create-qrph-payment.ts
      retrieve-payment-intent.ts
      verify-webhook.ts
      types.ts
```

Adapt naming to the existing architecture.

Responsibilities should include:

- choose correct test/live credentials;
- create Payment Intent;
- create QR Ph Payment Method;
- attach Payment Method;
- retrieve Payment Intent;
- normalize PayMongo errors;
- verify webhook signatures;
- avoid leaking secrets;
- support idempotency keys.

Do not create a second parallel PayMongo architecture if one already exists.

---

# 9. CREATE LOCAL ORDER BEFORE PAYMENT

Before requesting a QR code, create or reuse a local order/checkout record.

Initial state should be equivalent to:

```text
order_status   = pending
payment_status = pending
```

or:

```text
order_status   = pending_payment
payment_status = pending
```

Follow existing domain conventions.

The payment must be associated with a known local order ID before PayMongo resources are created.

Example reference:

```text
Order: ORD-2026-000123
```

This order reference should also be stored in PayMongo metadata/description where the API supports it.

---

# 10. SERVER-SIDE ORDER AMOUNT VALIDATION

This is mandatory.

The browser must **not** control the authoritative payment amount.

Bad:

```json
{
  "orderId": "abc",
  "amount": 1
}
```

where the backend blindly uses `amount`.

Correct approach:

```text
Frontend sends order/cart reference
        ↓
Server loads product/variant prices
        ↓
Server validates quantities, discounts, shipping, promotions
        ↓
Server calculates authoritative total
        ↓
Server converts PHP amount → centavos
        ↓
PayMongo Payment Intent uses server total
```

Example:

```text
₱1,299.00
```

becomes:

```text
129900 centavos
```

Also verify:

- order exists;
- order is not cancelled;
- order is not already paid;
- product variants still exist;
- requested quantities remain valid;
- price/discount rules are valid;
- shipping fee is current;
- currency is PHP.

---

# 11. CREATE PAYMONGO PAYMENT INTENT

Use the Payment Intent flow.

Conceptual request:

```http
POST https://api.paymongo.com/v1/payment_intents
```

Payload concept:

```json
{
  "data": {
    "attributes": {
      "amount": 129900,
      "currency": "PHP",
      "payment_method_allowed": ["qrph"],
      "description": "Order ORD-2026-000123"
    }
  }
}
```

Use the actual current PayMongo API structure and the project's PayMongo client implementation.

## Requirements

- amount is server calculated;
- amount is in centavos;
- currency is `PHP`;
- allowed payment method is only `qrph` for this launch phase;
- description/reference identifies the local order;
- use an `Idempotency-Key` for POST creation requests;
- save the returned Payment Intent ID.

Example stored value:

```text
pi_xxxxxxxxx
```

---

# 12. CREATE QR PH PAYMENT METHOD

Create a Payment Method with:

```text
type = qrph
```

Conceptually:

```http
POST https://api.paymongo.com/v1/payment_methods
```

Then attach the payment method to the Payment Intent according to PayMongo's current API.

The attach response should provide the QR action, including the QR image under the relevant `next_action` structure.

Current PayMongo documentation describes:

```text
next_action.code.image_url
```

as the Dynamic QR image data returned by the attach flow.

Do not persist the QR image longer than necessary unless the application has a valid reason.

Persist the underlying PayMongo references instead.

---

# 13. DATABASE DESIGN

First inspect existing tables and reuse existing fields whenever possible.

Do **not** create duplicate columns merely because they have different names.

At minimum the system must be capable of recording:

### Order

```text
id
order_number
customer/user/guest reference
subtotal
shipping_amount
discount_amount
total_amount
currency
order_status
payment_status
created_at
updated_at
```

### Payment information

Either in `orders` or a dedicated `payments` table:

```text
provider                  = paymongo
payment_method            = qrph
payment_intent_id
payment_method_id
provider_payment_id
amount
currency
status
expires_at
paid_at
created_at
updated_at
```

### Webhook/event processing

Recommended dedicated table:

```text
payment_webhook_events
----------------------
id
provider
provider_event_id UNIQUE
event_type
livemode
processed_at
processing_status
related_order_id
created_at
```

Possible processing states:

```text
received
processed
ignored
failed
```

The unique provider event ID is important for idempotency.

---

# 14. PAYMENT STATE MODEL

Keep payment state separate from fulfillment/order state whenever possible.

Recommended payment states:

```text
pending
processing
paid
failed
expired
cancelled
refunded
```

Recommended order states should continue following the application's established order workflow.

Example relationship:

```text
payment_status = pending
order_status   = pending_payment

payment_status = paid
order_status   = confirmed
```

Do not force these exact labels if the existing system already defines equivalent states.

The objective is semantic consistency, not renaming the whole application.

---

# 15. DYNAMIC QR PH CHECKOUT UI

The user experience should be simple.

Example:

```text
┌─────────────────────────────────────┐
│ Pay with QR Ph                      │
│                                     │
│             [ QR CODE ]             │
│                                     │
│ Scan using GCash, Maya, or a        │
│ participating QR Ph banking app.    │
│                                     │
│ Order: ORD-2026-000123              │
│ Total: ₱1,299.00                    │
│                                     │
│ Expires in: 28:42                   │
│                                     │
│ Waiting for payment...              │
└─────────────────────────────────────┘
```

Required UI states:

```text
creating_payment
waiting_for_payment
confirming
paid
expired
failed
cancelled
```

## UX requirements

While waiting:

- show order number;
- show exact amount;
- show QR clearly;
- state that GCash/Maya/participating QR Ph apps may scan it;
- show expiration countdown if expiration timestamp is available;
- tell customer not to close the page if appropriate;
- still support recovery if they do close/reload.

On expiration:

```text
This QR code has expired.
[ Generate a new QR ]
```

Do not create an entirely new order merely because a QR expired.

Use the same valid unpaid order and follow PayMongo's recommended QR regeneration mechanism.

---

# 16. QR EXPIRATION

PayMongo currently documents Dynamic QR Ph as expiring after approximately 30 minutes by default if not scanned.

Handle:

```text
qrph.expired
```

When received:

- locate the associated order/payment;
- do not mark the order paid;
- mark the current QR attempt expired;
- keep the order unpaid if still valid;
- allow generation of a replacement QR when appropriate;
- do not duplicate the order.

PayMongo currently indicates a new QR can be generated by creating another QR Ph Payment Method and attaching it to the same valid Payment Intent when appropriate.

Confirm behavior against the actual API response during implementation.

---

# 17. WEBHOOK ENDPOINT — CRITICAL

Create or audit a public HTTPS endpoint such as:

```text
POST /api/webhooks/paymongo
```

Example production URL:

```text
https://your-production-domain.com/api/webhooks/paymongo
```

Do not dynamically create webhooks on every order.

A webhook endpoint is infrastructure/configuration and should normally be registered once per environment.

Use separate test/live webhook configurations.

---

# 18. REQUIRED WEBHOOK EVENTS

For this QR Ph launch, subscribe only to events that the application handles.

At minimum:

```text
payment.paid
payment.failed
qrph.expired
```

Additional events may be handled only if the existing integration genuinely needs them.

Do not subscribe to every PayMongo event unnecessarily.

---

# 19. WEBHOOK SIGNATURE VERIFICATION — EXACT REQUIREMENT

Never process a PayMongo webhook before verifying its signature.

PayMongo sends:

```http
Paymongo-Signature: ...
```

The current documented header contains:

```text
t=<timestamp>,te=<test signature>,li=<live signature>
```

Where:

- `t` = request timestamp
- `te` = test-mode signature
- `li` = live-mode signature

## Verification algorithm

1. Read the **raw, unmodified request body**.
2. Parse the `Paymongo-Signature` header.
3. Extract `t`, `te`, and `li`.
4. Build:

```text
<t>.<raw_request_body>
```

5. Compute HMAC-SHA256 using the webhook endpoint signing secret.
6. In test mode compare against `te`.
7. In live mode compare against `li`.
8. Use a timing-safe comparison.
9. Reject invalid signatures before parsing/processing the event.
10. Optionally enforce a reasonable timestamp tolerance to reduce replay risk.

Pseudo-code:

```ts
signedPayload = `${timestamp}.${rawBody}`

expected = HMAC_SHA256(
  webhookSigningSecret,
  signedPayload
)

provided = isLive ? header.li : header.te

timingSafeCompare(expected, provided)
```

Do not use the PayMongo API secret key as the webhook signing secret.

The webhook endpoint has its own signing secret.

---

# 20. NEXT.JS RAW BODY REQUIREMENT

The implementation must preserve the exact bytes used for webhook verification.

Do not mutate/re-serialize the payload before verifying.

Depending on the Next.js version/router used, obtain the raw request body using the appropriate framework mechanism.

Conceptually:

```ts
const rawBody = await request.text();
```

Verify the signature against that exact string before:

```ts
JSON.parse(rawBody)
```

Do not blindly copy Express middleware examples into Next.js.

Implement the equivalent correctly for the project's current Next.js architecture.

---

# 21. AUTHORITATIVE PAYMENT CONFIRMATION

The authoritative production signal is a **verified PayMongo event and/or server-side retrieval of the Payment Intent**.

Never mark an order paid because:

```text
/payment/success
?paid=true
frontend variable
localStorage value
client callback
customer screenshot
```

is present.

For `payment.paid`:

```text
Webhook received
      ↓
Signature valid?
      ↓ no → reject
      ↓ yes
Event already processed?
      ↓ yes → acknowledge safely
      ↓ no
Find local order/payment
      ↓
Validate PayMongo identifiers
      ↓
Validate expected amount
      ↓
Validate currency = PHP
      ↓
Validate appropriate live/test mode
      ↓
Atomic database transaction
      ↓
Payment = paid
Order = appropriate paid state
Side effects = exactly once
      ↓
Record event processed
      ↓
Return 2xx
```

---

# 22. PAYMENT.PAID VALIDATION

Before changing database state, validate as much as the webhook/payment resource allows:

- event signature is valid;
- event type is `payment.paid`;
- expected environment/livemode matches;
- PayMongo Payment Intent/payment reference matches the stored order;
- amount equals the server-side order total;
- currency equals `PHP`;
- order is not cancelled;
- payment has not already been finalized.

If webhook fields do not expose all required values directly, retrieve the relevant Payment Intent server-side before finalizing payment.

---

# 23. IDEMPOTENCY — MANDATORY

PayMongo may retry webhook deliveries.

Therefore the application must be safe when receiving the same event multiple times.

Use:

```text
data.id
```

from the PayMongo webhook event as the provider event identifier.

Store it under a database uniqueness constraint where practical.

Example:

```sql
UNIQUE(provider, provider_event_id)
```

Repeated event:

```text
evt_123
evt_123
evt_123
```

must result in:

```text
ONE business transaction
```

not three.

The same webhook must never cause:

- duplicate stock deduction;
- duplicate order confirmation;
- duplicate ledger entry;
- duplicate notification;
- duplicate invoice;
- duplicate fulfillment;
- duplicate analytics conversion;
- duplicate customer reward;
- duplicate email.

Also use PayMongo's `Idempotency-Key` header for POST requests that create/modify PayMongo resources.

A useful key can be deterministic:

```text
paymongo-pi:<order-id>
paymongo-pm:<order-id>:<attempt-number>
```

Keep within PayMongo's documented maximum size.

---

# 24. ATOMIC DATABASE PROCESSING

Payment finalization should use a Supabase/Postgres transaction or equivalent atomic database function whenever multiple state changes must occur together.

Example conceptual transaction:

```text
BEGIN

lock/select payment/order
verify not already processed
insert webhook event if new
update payment → paid
update order → confirmed
deduct/reserve inventory if that is the defined business timing
create ledger/audit entries if required

COMMIT
```

If any critical operation fails:

```text
ROLLBACK
```

Do not leave:

```text
payment = paid
inventory = unchanged
```

or other partial inconsistent states if the domain expects them to be atomic.

Adapt this to the application's existing inventory/order accounting model.

---

# 25. STOCK DEDUCTION RULE

Before implementing, inspect when inventory is currently deducted.

Do not arbitrarily move the stock-deduction point.

Possible designs include:

```text
reserve at checkout → finalize on payment
```

or:

```text
deduct only after payment
```

Preserve the documented business rule.

Whatever rule exists, webhook retries must not alter inventory twice.

---

# 26. GUEST CHECKOUT SUPPORT

If the application allows guest checkout:

- do not require authentication solely for QR Ph payment;
- associate the payment with a secure order/checkout token;
- do not expose sequential/internal identifiers unnecessarily;
- validate the guest session/order ownership when generating/retrieving a QR;
- ensure one customer cannot retrieve another customer's payment details.

Do not break persisted guest carts.

---

# 27. FRONTEND PAYMENT STATUS UPDATES

The page may poll the server for payment status for good UX.

Example:

```text
GET /api/orders/<public-reference>/payment-status
```

But the polling endpoint must read **server/database truth**.

It must not directly decide payment based on browser state.

Preferred:

```text
PayMongo webhook
    ↓
database updated
    ↓
frontend polling/realtime subscription
    ↓
UI shows Paid
```

Supabase Realtime may be used if it already fits the architecture.

Do not introduce it solely for this task if simple polling is cleaner.

---

# 28. RECOVERY IF WEBHOOK DELIVERY IS INTERRUPTED

Production systems need reconciliation.

PayMongo documents webhook retries, but the application should still have a recovery mechanism.

Implement at least one safe server-side reconciliation path:

```text
pending local payment
      ↓
retrieve Payment Intent from PayMongo
      ↓
if status = succeeded
      ↓
apply same idempotent finalization logic
```

Use this for cases such as:

- webhook endpoint temporarily unavailable;
- deployment interrupted;
- customer returns while local status is still pending;
- webhook delivery exhausted retries.

Do not run high-frequency uncontrolled polling against PayMongo.

---

# 29. SUCCESS PAGE RULE

The success page should never blindly say:

```text
Payment successful!
```

only because the browser navigated there.

Correct states:

```text
Checking payment...
```

Then:

```text
Payment confirmed ✅
```

only after the backend/database confirms payment.

If still pending:

```text
We're still confirming your payment.
Your order will update automatically.
```

If expired:

```text
The QR code expired before payment was confirmed.
Generate a new QR to continue.
```

---

# 30. ERROR HANDLING

Normalize PayMongo errors into safe application errors.

Frontend examples:

```text
Unable to create payment. Please try again.
```

```text
This QR code has expired.
```

```text
We could not confirm this payment yet.
```

Do not send raw PayMongo response bodies containing sensitive internals directly to users.

Server logs should include useful correlation identifiers such as:

```text
order_id
order_number
payment_intent_id
event_id
event_type
environment
```

Do not log:

```text
sk_live_...
webhook secret
Authorization header
full sensitive customer data
```

---

# 31. LIVE VS TEST ISOLATION

Required:

```text
Development / staging
→ sk_test_...
→ test webhook
→ livemode = false

Production
→ sk_live_...
→ live webhook
→ livemode = true
```

Do not let production accidentally use test keys.

Do not let development accidentally make live charges.

On application boot/server initialization, consider validating:

```text
NODE_ENV=production
PAYMONGO_MODE=live
PAYMONGO_SECRET_KEY begins with sk_live_
```

and fail safely on obviously mismatched configuration.

Do not print the actual secret in the error.

---

# 32. LIVE WEBHOOK REGISTRATION

In the PayMongo Dashboard:

```text
Developers
→ Webhooks
→ Add Endpoint
```

Use the production HTTPS endpoint.

Subscribe to:

```text
payment.paid
payment.failed
qrph.expired
```

Store the returned signing secret in the production secret/environment manager.

Test and live webhook endpoints are mode-scoped; configure the correct live endpoint for real transactions.

Do not commit the signing secret.

---

# 33. PAYMONGO DASHBOARD / ACCOUNT CHECKLIST

Before launch, the human operator must verify:

- [ ] PayMongo login works.
- [ ] Identity/KYC requirements required for account activation are complete.
- [ ] Dashboard is switched to Live mode.
- [ ] QR Ph shows as active/available OR the live capability API returns `qrph`.
- [ ] Live API key is available.
- [ ] Live secret key has been stored only in production server environment variables.
- [ ] Production webhook endpoint exists.
- [ ] Webhook endpoint uses HTTPS.
- [ ] `payment.paid` is subscribed.
- [ ] `payment.failed` is subscribed.
- [ ] `qrph.expired` is subscribed.
- [ ] Live webhook signing secret is deployed securely.
- [ ] Production domain works over HTTPS.

The developer must **not** request that the user paste `sk_live_*` or webhook secrets into an AI chat.

---

# 34. PRODUCTION WEBSITE REQUIREMENTS

Before launch, ensure customer-facing commerce basics are present and functional.

At minimum the site should have appropriate pages/information such as:

- contact details;
- product information;
- PHP prices;
- privacy policy;
- terms and conditions;
- return/refund policy;
- shipping/delivery information where relevant.

Do not create fake legal/business registration information.

Do not claim the business is DTI/BIR-registered if it is not.

---

# 35. FIRST REAL-MONEY PRODUCTION TEST

After all test-mode acceptance criteria pass, perform a controlled real transaction.

Recommended:

1. Create a low-value legitimate test product/order that still respects PayMongo's QR Ph minimum.
2. Checkout through the actual production website.
3. Verify production creates a `pi_*` using live credentials.
4. Verify a Dynamic QR Ph is displayed.
5. Scan using a participating QR Ph app such as GCash or Maya.
6. Pay the exact displayed amount.
7. Confirm the PayMongo Dashboard shows the transaction.
8. Confirm production webhook delivery.
9. Confirm signature verification succeeds.
10. Confirm one webhook event record is stored.
11. Confirm local payment becomes `paid`.
12. Confirm correct order becomes paid/confirmed.
13. Confirm inventory side effects occur exactly once.
14. Refresh the page.
15. Confirm no duplicate processing occurs.
16. Replay/re-deliver webhook if the Dashboard supports it.
17. Confirm idempotency still prevents duplicate effects.

Do not use a large amount for the first production verification.

---

# 36. REQUIRED TEST CASES

## T01 — Existing sandbox remains functional

```text
Given test environment
When checkout is created
Then PayMongo test credentials are used
And no real money is moved
```

## T02 — Production configuration selects live keys

```text
Given production environment
When payment is created
Then live credentials are used server-side
And no secret appears in browser/network responses
```

## T03 — QR Ph capability preflight

```text
Given live PayMongo account
When capabilities are retrieved
Then qrph must be present before production checkout is enabled
```

## T04 — Correct order amount

```text
Given cart total ₱1,299.00
When Payment Intent is created
Then amount = 129900
And currency = PHP
```

## T05 — Frontend amount tampering

```text
Given malicious browser changes amount to ₱1
When payment is created
Then server ignores forged amount
And recalculates the actual total
```

## T06 — Dynamic QR generated

```text
Given valid unpaid order
When QR Ph Payment Method is attached
Then Dynamic QR is returned and displayed
```

## T07 — Successful real/test QR payment

```text
Given valid payment
When verified payment.paid arrives
Then payment becomes paid
And correct order transitions once
```

## T08 — Invalid webhook signature

```text
Given forged webhook
When signature is invalid
Then request is rejected
And database is unchanged
```

## T09 — Duplicate `payment.paid`

```text
Given same event delivered twice
When second copy arrives
Then handler acknowledges safely
And no duplicate side effects occur
```

## T10 — QR expiration

```text
Given QR remains unpaid
When qrph.expired arrives
Then payment attempt becomes expired
And order is not marked paid
```

## T11 — Failed payment

```text
Given payment.failed event
When verified
Then order remains unpaid
And status is updated appropriately
```

## T12 — Browser refresh

```text
Given customer is waiting for payment
When page refreshes
Then existing order/payment can be recovered
And duplicate Payment Intent is not created unnecessarily
```

## T13 — Success URL spoofing

```text
Given user manually opens success URL
When no paid payment exists
Then app does not mark/display payment as confirmed
```

## T14 — Wrong order amount in webhook/resource

```text
Given provider amount differs from local expected amount
When event arrives
Then payment is not blindly finalized
And discrepancy is logged for investigation
```

## T15 — Environment mismatch

```text
Given live event reaches test handler/config
Then event is rejected/ignored safely
And no order state is changed
```

---

# 37. OBSERVABILITY

Add enough logging to debug production payments safely.

Recommended structured fields:

```text
event: paymongo.payment.created
order_id
order_number
payment_intent_id
mode
```

```text
event: paymongo.webhook.received
provider_event_id
event_type
livemode
```

```text
event: paymongo.webhook.processed
provider_event_id
order_id
result
```

Avoid logging entire payment payloads unless safely redacted.

Never log secrets.

---

# 38. RATE LIMITING / ABUSE PROTECTION

Payment creation endpoints should have reasonable abuse controls.

At minimum:

- validate session/order ownership;
- prevent unlimited active payment attempts for one order;
- reuse existing valid Payment Intent when appropriate;
- apply application rate limiting if infrastructure supports it;
- do not create a new PayMongo resource on every frontend render;
- do not let crawlers/bots generate real payment intents freely.

---

# 39. QR REGENERATION

When the current QR expires:

```text
User clicks Generate New QR
       ↓
Server verifies order still valid and unpaid
       ↓
Server verifies old attempt expired
       ↓
Create new QR Ph payment method
       ↓
Attach appropriately
       ↓
Return new QR
```

Use an idempotent attempt model.

Do not let rapid repeated clicks create an unbounded number of PayMongo resources.

---

# 40. ORDER CANCELLATION

If the customer cancels an unpaid order:

- mark local order cancelled according to existing rules;
- do not mark payment paid;
- if a late provider event is received, do not silently ignore real money;
- flag/reconcile the case according to existing refund/manual-review rules.

Do not automatically invent a refund flow unless one already exists or is explicitly implemented.

Real-money edge cases must remain traceable.

---

# 41. REFUNDS — OUT OF SCOPE UNLESS ALREADY IMPLEMENTED

This launch phase primarily covers accepting QR Ph payments.

Refund API implementation is not required unless:

- it already exists;
- current checkout/order rules require it;
- or it is necessary to preserve existing behavior.

However, the data model must not prevent adding refunds later.

Recommended payment state supports:

```text
refunded
```

---

# 42. DO NOT IMPLEMENT THESE YET

Unless already present and required for backwards compatibility:

```text
Direct GCash
Visa
Mastercard
Google Pay
Subscriptions
Installments
Saved cards
Recurring billing
BNPL
```

The goal is intentionally narrow:

```text
Launch safely with REAL Dynamic QR Ph first.
```

---

# 43. REQUIRED AI IMPLEMENTATION SEQUENCE

The coding AI must work in this order:

### Phase 1 — Read
- Read `app-documentation/`.
- Read relevant source code.

### Phase 2 — Audit
- Explain existing PayMongo architecture.
- Identify reusable components.
- Identify gaps.

### Phase 3 — Account capability preflight
- Add or provide a safe server-side way to verify live `qrph` capability.
- Do not expose live secret.

### Phase 4 — Configuration
- Separate test/live modes safely.
- Validate production environment.

### Phase 5 — Payment creation
- Server-side order total.
- Payment Intent.
- QR Ph Payment Method.
- Attach.
- Store references.
- Return QR data safely.

### Phase 6 — Checkout UI
- QR display.
- Waiting state.
- Expiration.
- Recovery.

### Phase 7 — Webhook security
- Raw body.
- Signature verification.
- Test/live signature selection.
- Idempotency.

### Phase 8 — Payment finalization
- Validate amount/currency/reference.
- Atomic update.
- Existing side effects exactly once.

### Phase 9 — Recovery
- Payment Intent reconciliation.
- Page refresh recovery.

### Phase 10 — Tests
- Run unit/integration tests.
- Preserve existing tests.

### Phase 11 — Documentation
- Update `app-documentation/`.
- Document env names without values.
- Document Dashboard steps.
- Document troubleshooting.

### Phase 12 — Report
Provide:

```text
Implemented
Changed files
Database changes
Environment variables required
Manual PayMongo Dashboard actions
Test results
Production readiness
Known limitations
```

---

# 44. DATABASE MIGRATION RULES

If schema changes are necessary:

1. Use proper migrations.
2. Do not edit production database manually as the implementation method.
3. Avoid destructive migrations.
4. Add indexes/unique constraints required for webhook idempotency.
5. Preserve existing data.
6. Use nullable fields when rollout requires backwards compatibility.
7. Document rollback where practical.

Example:

```sql
CREATE UNIQUE INDEX ...
ON payment_webhook_events(provider, provider_event_id);
```

Only implement tables/columns actually required by the current architecture.

---

# 45. SECURITY CHECKLIST

Before declaring production-ready:

- [ ] `sk_live_*` exists only server-side.
- [ ] webhook signing secret exists only server-side.
- [ ] no secret is committed to Git.
- [ ] no secret is returned by APIs.
- [ ] no secret is logged.
- [ ] webhook body is verified before JSON processing.
- [ ] live signature (`li`) is used for live webhooks.
- [ ] test signature (`te`) is used for test webhooks.
- [ ] timing-safe signature comparison is implemented.
- [ ] invalid signature causes no DB mutation.
- [ ] frontend cannot control authoritative amount.
- [ ] order ownership/access is validated.
- [ ] webhook event idempotency is enforced.
- [ ] payment creation uses idempotency keys.
- [ ] production uses HTTPS.
- [ ] environment mismatch safeguards exist.
- [ ] duplicate stock/ledger effects are impossible under normal retries.

---

# 46. LAUNCH ACCEPTANCE CRITERIA

The implementation is complete only when all relevant items pass:

## Account / capability

- [ ] Individual-account launch path is preserved.
- [ ] DTI registration is not introduced as an app-level QR Ph launch requirement.
- [ ] BIR Form 2303 is not introduced as an app-level QR Ph launch requirement.
- [ ] Live capability check confirms `qrph`.
- [ ] No attempt is made to bypass PayMongo account/KYC restrictions.

## Existing functionality

- [ ] Existing sandbox PayMongo flow still works.
- [ ] Existing checkout behavior remains functional.
- [ ] Existing guest cart behavior remains functional.
- [ ] Existing product/inventory flows are not unintentionally changed.

## QR Ph

- [ ] Dynamic QR Ph can be generated.
- [ ] QR corresponds to correct order amount.
- [ ] Amount is calculated server-side.
- [ ] QR can be scanned through a participating QR Ph application.
- [ ] QR expiration is handled.
- [ ] New QR can be safely generated for an eligible unpaid order.

## Webhook

- [ ] Production webhook uses HTTPS.
- [ ] `payment.paid` handled.
- [ ] `payment.failed` handled.
- [ ] `qrph.expired` handled.
- [ ] Signature is verified correctly.
- [ ] Invalid signatures are rejected.
- [ ] Raw body is preserved.
- [ ] Duplicate events are harmless.

## Database

- [ ] Payment Intent reference is stored.
- [ ] provider payment reference is stored when available.
- [ ] payment status is stored.
- [ ] successful event updates exactly one order.
- [ ] duplicate webhook cannot duplicate inventory/ledger/business actions.
- [ ] webhook events can be traced.

## Production

- [ ] Production uses `sk_live_*`.
- [ ] Test/development uses `sk_test_*`.
- [ ] No source-code edit is required to switch modes.
- [ ] One controlled real payment succeeds end-to-end.
- [ ] PayMongo Dashboard shows the real transaction.
- [ ] Webhook reaches production.
- [ ] Application shows the order as paid only after backend confirmation.

---

# 47. DEFINITION OF DONE

This project is considered ready for launch when:

```text
Individual PayMongo account
        +
live QR Ph capability confirmed
        +
production Next.js server
        +
Supabase order/payment persistence
        +
Dynamic QR Ph
        +
verified production webhook
        +
idempotent payment finalization
        +
one successful controlled real payment
        =
READY FOR QR PH PRODUCTION LAUNCH
```

The lack of DTI registration or BIR Form 2303 must **not be treated by the application as a blocker for this QR Ph-only phase**, provided PayMongo itself has activated the account and its live capability API reports `qrph`.

If PayMongo does not activate the account or does not expose `qrph`, the developer must stop at the account boundary and report it rather than bypassing PayMongo.

---

# 48. FINAL INSTRUCTION TO THE CODING AI

Implement this specification against the existing application.

Do not merely describe how it could be implemented.

Start by reading the relevant `app-documentation/` files and auditing the existing PayMongo sandbox implementation.

Then implement the **smallest production-safe extension** that supports **Live Dynamic QR Ph** while keeping sandbox intact.

Do not redesign unrelated modules.

Do not add Direct GCash/cards as launch requirements.

Do not request DTI/BIR Form 2303 as application prerequisites for this QR Ph-only phase.

Do not ask the user to paste secrets into chat.

If the application code can be completed but PayMongo has not exposed the live `qrph` capability, complete all safe code preparation and clearly identify the remaining PayMongo account-side blocker.

After implementation:

1. run tests;
2. report modified files;
3. report migrations;
4. report required environment variable **names only**;
5. report manual PayMongo Dashboard steps;
6. update relevant `app-documentation/`;
7. provide a concise production launch checklist.

---

# 49. OFFICIAL PAYMONGO REFERENCES

These references were checked while preparing this implementation specification.

- Account capabilities and QR Ph eligibility:  
  https://docs.paymongo.com/docs/account-settings-account-capabilities

- Dynamic QR Ph API:  
  https://docs.paymongo.com/docs/payment-acceptance-qr-ph-api

- QR Ph overview and supported apps:  
  https://docs.paymongo.com/docs/payment-acceptance-qr-ph

- API keys and test/live behavior:  
  https://docs.paymongo.com/do/docs/account-settings-api-keys

- Webhook setup and signature format:  
  https://docs.paymongo.com/docs/developer-tools-webhook-setup-management

- Webhook events:  
  https://docs.paymongo.com/docs/developer-tools-webhooks-events

- Webhook reliability/best practices:  
  https://docs.paymongo.com/docs/developer-tools-best-practices

- Developer security / idempotency / signature verification:  
  https://docs.paymongo.com/docs/developer-tools-best-practices-1

- Developer go-live checklist:  
  https://docs.paymongo.com/docs/developer-tools-go-live-checklist

- Payment troubleshooting / QR expiration:  
  https://docs.paymongo.com/docs/payment-acceptance-troubleshooting

---

> **Maintenance note:** PayMongo requirements and API behavior can change. Before a future launch or major payment change, re-check the official PayMongo documentation. `app-documentation/` should then be updated if provider behavior or application behavior changes.
