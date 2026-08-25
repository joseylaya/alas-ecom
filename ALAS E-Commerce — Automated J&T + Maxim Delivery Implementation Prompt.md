# ALAS E-Commerce — Checkout Delivery & Automated Shipping

You are working on my existing **ALAS E-Commerce** application.

Your task is to implement a production-ready **Delivery / Shipping Selection system on the Checkout page**.

Before making any changes:

1. Read the relevant files inside `app-documentation/`.
2. Treat `app-documentation/` as the canonical source of truth.
3. Inspect the existing checkout, cart, address, order, product, payment, and PayMongo implementation.
4. Reuse the existing architecture, conventions, components, database patterns, validation, and APIs.
5. Do NOT unnecessarily rewrite working functionality.
6. Do NOT break guest checkout, cart persistence, authentication, PayMongo, order creation, or existing payment flows.
7. Do NOT invent undocumented J&T or Maxim API endpoints, credentials, or responses.
8. If official provider API credentials are unavailable, create a clean provider abstraction and configurable fallback instead of faking the integration.

---

# PRIMARY GOAL

Add a new **Delivery Method** section to Checkout.

Customers can select:

- **J&T Express**
- **Maxim Delivery**

However:

### J&T
J&T should be available for supported Philippine addresses.

### Maxim
Maxim should only become available when the customer's delivery address is inside our configured **Cebu service area**.

Do NOT rely only on:

```text
address.includes("Cebu")
```

Use structured address information such as:

```text
country
province
city / municipality
barangay
postal_code
latitude
longitude
```

Maxim eligibility must be controlled by a centralized service-area configuration.

Example:

```ts
isMaximEligible(address)
```

Do not scatter Cebu checks throughout the frontend.

---

# CHECKOUT FLOW

The intended checkout flow should be:

```text
Cart
  ↓
Customer Details
  ↓
Delivery Address
  ↓
Validate Address
  ↓
Determine Available Delivery Providers
  ↓
Get Shipping Quotes
  ↓
Customer Selects Delivery Provider
  ↓
Subtotal
Shipping Fee
Discount
----------------
Grand Total
  ↓
Payment
  ↓
Create Order
```

Example:

```text
Subtotal                 ₱1,500
Delivery
○ J&T Express             ₱145
● Maxim Delivery           ₱92

--------------------------------
Total                     ₱1,592
```

The selected shipping fee MUST be included in the amount that the customer pays.

---

# MAXIM CEBU ELIGIBILITY

Create something similar to:

```ts
isMaximEligible(address): boolean
```

Do not hard-code this directly into the checkout UI.

Prefer an admin/configuration-based service area such as:

```text
delivery_service_areas

id
provider
country
province
city
enabled
created_at
updated_at
```

Example:

```text
provider: maxim
country: Philippines
province: Cebu
city: Cebu City
enabled: true
```

This allows us to add/remove Maxim-supported areas later without modifying the checkout code.

If the address is outside the configured Cebu service area:

- Hide Maxim, or
- Show it disabled with:

```text
Maxim Delivery
Available for selected Cebu areas only
```

Prefer hiding it unless showing the disabled option improves UX.

---

# ADDRESS VALIDATION

Use structured Philippine address fields wherever possible.

Recommended structure:

```ts
{
  country,
  region,
  province,
  city,
  municipality,
  barangay,
  postalCode,
  streetAddress,
  latitude,
  longitude
}
```

If the project already uses another address structure, preserve it and extend only when necessary.

Do not trust frontend validation alone.

Maxim eligibility MUST also be validated on the backend before an order/payment is finalized.

---

# SHIPPING QUOTE ARCHITECTURE

Create a provider-independent shipping architecture.

Example:

```ts
interface ShippingProvider {
  getQuote(input: ShippingQuoteInput): Promise<ShippingQuote>;
  validateServiceArea(address: Address): Promise<boolean>;
}
```

Possible implementations:

```text
JntShippingProvider
MaximShippingProvider
```

The Checkout page should NOT contain provider-specific API logic.

Use a shipping service such as:

```text
ShippingService
    ├── JntShippingProvider
    └── MaximShippingProvider
```

---

# SHIPPING QUOTE INPUT

Design a normalized input similar to:

```ts
interface ShippingQuoteInput {
  origin: Address;
  destination: Address;

  parcel: {
    weightKg: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    declaredValue?: number;
  };

  cartItems: CartItem[];
}
```

---

# PRODUCT SHIPPING INFORMATION

Shipping calculations may require package weight and dimensions.

Check the existing product schema first.

If these fields do not exist and are necessary, add appropriate shipping information such as:

```text
weight_grams
package_length_cm
package_width_cm
package_height_cm
```

Do NOT require customers to enter these values.

They belong to product/admin information.

For multiple cart items, create a reasonable package calculation strategy.

At minimum calculate:

```text
totalWeight =
SUM(product.weight × quantity)
```

Dimensions should either:

- use proper package calculation if the project supports it,
- use predefined shipping package profiles,
- or use configurable default package dimensions.

Do not create fake physical calculations that could produce unreliable shipping fees.

---

# J&T EXPRESS

Create:

```text
JntShippingProvider
```

The system should eventually support:

```text
origin
destination
weight
dimensions
declared value
service type
shipping quotation
shipment creation
tracking number
tracking status
```

If official J&T API credentials/documentation are currently available in the project, integrate them according to their official specification.

If they are NOT available:

DO NOT:

- scrape the J&T website
- reverse-engineer private endpoints
- invent API URLs
- invent API credentials

Instead implement:

```text
JntShippingProvider
```

with two possible modes:

```text
API
CONFIGURED_RATE
```

Example:

```env
JNT_SHIPPING_MODE=configured_rate
```

Later:

```env
JNT_SHIPPING_MODE=api
JNT_API_KEY=
JNT_API_SECRET=
JNT_CUSTOMER_CODE=
```

The API implementation can then replace the fallback without changing Checkout.

---

# MAXIM DELIVERY

Create:

```text
MaximShippingProvider
```

Maxim should first check:

```ts
validateServiceArea(destination)
```

If destination is unsupported:

```ts
available: false
```

If supported:

```ts
available: true
```

If an official Maxim business/API integration exists and credentials are available, use it for real-time quotations.

If no approved API integration is available, DO NOT scrape or imitate Maxim.

Use a configurable estimate/fallback rate engine temporarily.

---

# MAXIM FALLBACK RATE ENGINE

Because local courier costs are generally distance-based, prepare the system to calculate:

```text
pickup coordinates
↓
customer coordinates
↓
distance
↓
configured base rate
+
distance rate
↓
estimated delivery fee
```

Example configuration:

```text
delivery_provider_settings

provider
base_fee
base_distance_km
additional_fee_per_km
minimum_fee
maximum_distance_km
enabled
```

Example only:

```ts
calculateMaximFallback(distanceKm)
```

Do NOT blindly hard-code real-world Maxim prices into application code.

Rates must be configurable from database/admin settings because they can change.

Clearly mark fallback quotations internally:

```text
quote_source = configured_rate
```

instead of pretending they came directly from Maxim.

---

# STORE PICKUP ORIGIN

Shipping calculations require the ALAS pickup/origin address.

This must NOT be entered manually for every checkout.

Create/use centralized store configuration:

```text
store_address
store_latitude
store_longitude
```

Example concept:

```text
ALAS Warehouse / Fulfillment Origin
→ customer delivery address
```

Use this origin when calculating Maxim distance and J&T shipping.

---

# SHIPPING QUOTE RESPONSE

Normalize all providers into something similar to:

```ts
interface ShippingQuote {
  provider: "jnt" | "maxim";

  serviceName: string;

  available: boolean;

  fee: number | null;

  currency: "PHP";

  quoteSource:
    | "provider_api"
    | "configured_rate";

  estimatedDelivery?: string;

  quoteId?: string;

  expiresAt?: string;

  reasonUnavailable?: string;
}
```

Checkout should consume only this normalized response.

---

# CHECKOUT UI

Add a clean section:

## Delivery Method

Example:

```text
Delivery Method

● J&T Express
  Standard Nationwide Delivery
  ₱145

○ Maxim Delivery
  Same-day / Local Cebu Delivery
  ₱92
```

For an eligible Cebu address, both may appear:

```text
J&T Express       ₱145
Maxim Delivery     ₱92
```

For an unsupported address:

```text
J&T Express       ₱185
```

Maxim should not be selectable.

---

# LOADING QUOTES

After the customer enters or changes their address:

```text
Calculating delivery fee...
```

Do not calculate a new quote on every keystroke.

Use an appropriate debounce or trigger quotations only after a sufficiently complete address has been selected/validated.

Display:

```text
J&T Express
₱145

Maxim Delivery
₱92
```

Handle quote loading independently from the rest of Checkout.

---

# ORDER SUMMARY

Update the checkout summary:

```text
Subtotal                  ₱1,500
Shipping                     ₱92
Discount                       ₱0
--------------------------------
Total                     ₱1,592
```

Never calculate the authoritative grand total only on the client.

Backend calculation must be:

```text
grand_total =
subtotal
+ validated_shipping_fee
- discount
+ other_applicable_charges
```

---

# PAYMENT INTEGRATION

This is critical.

The delivery/shipping fee must be included in the payment amount sent to the existing payment gateway.

Example:

```text
Products       ₱1,500
Shipping          ₱92
----------------------
PayMongo       ₱1,592
```

Do NOT allow the client to send an arbitrary shipping fee such as:

```json
{
  "shippingFee": 1
}
```

and have the backend trust it.

Before creating the PayMongo payment/payment intent:

1. Read cart/order items from trusted server data.
2. Recalculate subtotal.
3. Revalidate delivery address.
4. Revalidate selected provider.
5. Recalculate or validate the shipping quote.
6. Apply discounts.
7. Calculate final total.
8. Create payment using that server-calculated amount.

---

# QUOTE SECURITY

Shipping quotes should preferably have a server-generated identifier.

Example:

```text
shipping_quotes

id
provider
user_id nullable
session_id nullable
destination_hash
amount
currency
source
expires_at
metadata
created_at
```

Checkout sends:

```text
shipping_quote_id
```

instead of trusting a client-provided shipping amount.

For guest users, associate quotes using the existing guest/session/cart mechanism.

A quote should have an expiration time.

If it expires before payment:

```text
Your delivery fee has changed.
Please review the updated total before continuing.
```

Never silently charge a different amount.

---

# ORDER DATA

Persist the selected delivery information with the order.

Example fields/concept:

```text
delivery_provider
delivery_service
shipping_fee
shipping_quote_id
shipping_quote_source
shipping_status
tracking_number
tracking_url
delivery_address_snapshot
```

Do not depend entirely on the customer's editable address record after the order is placed.

Save an address snapshot with the order.

---

# SHIPPING STATUS

Prepare the architecture for:

```text
pending
booking
booked
picked_up
in_transit
out_for_delivery
delivered
failed
cancelled
```

Map provider-specific statuses into our internal statuses.

Do not tightly couple the Orders UI to J&T/Maxim status strings.

---

# FUTURE AUTOMATION

Design this so we can later automate:

### J&T

```text
Payment confirmed
↓
Create shipment
↓
Receive tracking number
↓
Save tracking number
↓
Track shipment
↓
Update order status
```

### Maxim

```text
Payment confirmed
↓
Create delivery booking
↓
Receive booking ID
↓
Assign rider
↓
Track delivery
↓
Delivered
```

DO NOT automatically create actual courier bookings during development unless provider production credentials and the intended business rules are confirmed.

Separate:

```text
shipping quotation
```

from:

```text
shipping booking
```

---

# PAYMENT FAILURE

If payment fails:

Do NOT create a real courier booking.

Desired behavior:

```text
Checkout
↓
Shipping quote
↓
Payment
↓
Payment successful
↓
Order confirmed
↓
Courier booking
```

The exact existing order/payment state machine must be inspected before implementation.

Preserve the application's current architecture where possible.

---

# DATABASE DESIGN

Do not create unnecessary tables if equivalent structures already exist.

Potential structures:

```text
delivery_providers
delivery_provider_settings
delivery_service_areas
shipping_quotes
order_shipments
```

But first inspect the existing database.

Extend existing models/tables when that is cleaner.

All migrations must be reversible and follow existing project conventions.

---

# ADMIN CONFIGURATION

Prepare the feature so an administrator can eventually configure:

```text
J&T
Enabled: Yes/No

Maxim
Enabled: Yes/No

Maxim Cebu Service Areas
- Cebu City
- Mandaue
- Lapu-Lapu
- etc.

Fallback Rates
Base fee
Per-km fee
Minimum fee
Maximum delivery distance
```

Do not scatter these values throughout source code.

Use configuration/database settings.

---

# FAIL-SAFE BEHAVIOR

Handle:

- provider API unavailable
- API timeout
- invalid address
- unsupported address
- missing product weight
- missing coordinates
- quotation expired
- quotation price changed
- provider disabled
- payment failed
- duplicate checkout request
- duplicate payment callback
- duplicate courier booking
- guest checkout
- page refresh
- cart modifications after quotation

If cart contents change:

```text
invalidate existing shipping quote
→ request new shipping quote
```

If address changes:

```text
invalidate existing shipping quote
→ re-check Maxim eligibility
→ recalculate rates
```

---

# IDEMPOTENCY

Courier shipment creation must be protected from duplicate execution.

For example, a repeated PayMongo webhook must NOT create:

```text
2 J&T shipments
```

or:

```text
2 Maxim riders
```

Use the project's existing idempotency/order state patterns where available.

---

# UX REQUIREMENTS

The feature must remain:

- mobile-first
- simple
- fast
- understandable
- minimal
- accessible
- friendly to non-technical buyers

Do not overload customers with courier configuration.

They only need to understand:

```text
Courier
Price
Estimated delivery
```

The system handles everything else.

---

# PERFORMANCE

Do not repeatedly call courier APIs unnecessarily.

Use appropriate quote caching.

Example:

```text
same cart
+
same destination
+
same parcel
=
reuse valid quote
```

until it expires.

---

# IMPORTANT ENGINEERING RULE

Create a clean boundary:

```text
Checkout
      ↓
ShippingService
      ↓
─────────────────────
↓                   ↓
J&T Provider    Maxim Provider
↓                   ↓
API/Fallback    API/Fallback
─────────────────────
      ↓
Normalized ShippingQuote
      ↓
Checkout Total
      ↓
Payment
```

The checkout should never care how a provider calculated its fee.

---

# IMPLEMENTATION ORDER

Implement this carefully in phases.

### Phase 1 — Discovery

Inspect:

- `app-documentation/`
- checkout
- cart
- guest cart
- addresses
- products
- orders
- database
- payment/PayMongo
- environment variables
- admin settings

Report what currently exists before restructuring anything.

### Phase 2 — Domain Layer

Implement:

- shipping types
- provider interface
- ShippingService
- Cebu eligibility logic
- provider configuration

### Phase 3 — Backend

Implement:

- quotation endpoint/service
- validation
- rate calculation
- quote persistence/caching
- server-side totals

### Phase 4 — Checkout UI

Implement:

- address → availability
- loading state
- delivery selection
- prices
- errors
- order summary

### Phase 5 — Payment Integration

Make shipping part of the authoritative payable amount.

### Phase 6 — Orders

Persist delivery/shipment information.

### Phase 7 — Tests

Test all acceptance scenarios.

### Phase 8 — Documentation

Update the relevant files inside `app-documentation/` so the implementation and documentation remain synchronized.

---

# REQUIRED ACCEPTANCE TESTS

At minimum verify:

### Scenario 1

```text
Address: Cebu City
```

Expected:

```text
J&T available
Maxim available
Both shipping prices displayed
Customer can select either
Selected shipping fee updates total
```

### Scenario 2

```text
Address: Mandaue
```

If configured as Maxim serviceable:

```text
J&T available
Maxim available
```

### Scenario 3

```text
Address: Manila
```

Expected:

```text
J&T available
Maxim unavailable
```

### Scenario 4

Customer changes:

```text
Cebu → Manila
```

Expected:

```text
previous quote invalidated
Maxim disappears
J&T rate recalculated
total recalculated
```

### Scenario 5

Customer changes cart quantity.

Expected:

```text
shipping quote invalidated
package weight recalculated
shipping rate recalculated
```

### Scenario 6

Quote API fails.

Expected:

- checkout does not crash
- clear customer-friendly message
- fallback used only if configured
- no fake quote shown as provider API rate

### Scenario 7

Customer manipulates frontend shipping price.

Expected:

```text
backend ignores manipulated value
backend recalculates authoritative amount
```

### Scenario 8

Payment amount.

Given:

```text
Subtotal = ₱1,500
Shipping = ₱92
```

PayMongo must receive:

```text
₱1,592
```

subject to discounts/other legitimate charges.

### Scenario 9

Payment webhook sent twice.

Expected:

```text
only one order fulfillment/shipping booking
```

---

# IMPORTANT: DO NOT FAKE PROVIDER INTEGRATION

If J&T or Maxim requires a business account, merchant approval, API credential, private documentation, or partnership before live API integration:

STOP only that specific external integration layer.

Do not block development of the entire feature.

Implement everything else:

```text
✓ Checkout UI
✓ Cebu detection
✓ Provider abstraction
✓ Quote service
✓ Fallback/configured shipping rates
✓ Database
✓ Server validation
✓ Payment total
✓ Orders
✓ Tests
```

and clearly document:

```text
EXTERNAL INTEGRATION PENDING
```

with exactly what credentials/documentation are still required.

Never claim an integration is live when it is not.

---

# FINAL EXPECTED RESULT

The customer experience should ultimately be:

```text
Enter Delivery Address
        ↓
System validates location
        ↓
Cebu?
   ↓           ↓
  YES          NO
   ↓           ↓
J&T + Maxim    J&T
   ↓           ↓
Automatic Delivery Quotes
        ↓
Select Courier
        ↓
Shipping Added to Checkout
        ↓
Grand Total
        ↓
Payment
        ↓
Order Confirmed
        ↓
Future: Automatic Courier Booking
```

Build this as a **production-quality shipping foundation**, not merely two radio buttons.

Preserve existing architecture whenever possible, keep implementation modular, and do not touch unrelated features.

After completing the implementation, provide:

1. Files changed
2. Database migrations added
3. Environment variables required
4. Shipping calculation architecture
5. Cebu/Maxim eligibility rules
6. J&T integration status
7. Maxim integration status
8. Fallback mechanism
9. Payment-total changes
10. Tests performed
11. Remaining external credentials or business approvals required
12. Documentation updated