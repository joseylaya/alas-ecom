# ALAS AI Development Constitution

**Document type:** Binding development constitution  
**Applies to:** ALAS E-Commerce codebase and all AI-assisted development  
**Status:** Active  
**Authority:** `app-documentation/` is the canonical source of truth  
**Version:** 1.0

---

## 1. Purpose

This constitution defines how any AI assistant, coding agent, or developer must work on the ALAS E-Commerce application.

Its purpose is to prevent:
- architectural drift;
- undocumented behavior changes;
- inconsistent folder structures;
- duplicated business logic;
- insecure shortcuts;
- stale documentation;
- accidental changes to unrelated features;
- database and payment mistakes;
- code that is difficult for the next developer or AI to understand.

The application must remain simple, predictable, secure, maintainable, mobile-first, and easy to extend.

---

## 2. Order of Authority

When deciding what the application should do, use this order:

1. **The user's latest explicit instruction**
2. **`app-documentation/`**
3. **Approved Architecture Decision Records (ADRs)**
4. **Existing tests and API/database contracts**
5. **Existing implementation**
6. **Developer or AI assumptions**

### Rule: documentation is the source of truth

`app-documentation/` is the official description of intended application behavior.

Code is an implementation of the documentation. Code must not silently redefine the product.

If code and documentation disagree:
- do not silently choose the code;
- identify the mismatch;
- determine whether the code is wrong or the documentation is stale;
- follow the user's latest explicit instruction;
- reconcile the documentation before the change is considered complete.

### Rule: current user instructions can change the truth

If the user intentionally changes a documented behavior, the new instruction becomes the intended behavior for that change. The AI must then flag the affected documentation for update.

---

## 3. Mandatory Documentation Impact Gate

Every functional tweak must end with a documentation-impact check.

Examples of documentation-impacting changes:
- customer flow changes;
- cart or checkout behavior;
- product or inventory rules;
- payment behavior;
- database schema changes;
- API request/response changes;
- authentication or authorization changes;
- route changes;
- order status changes;
- validation changes;
- shipping calculations;
- security rules;
- major UI behavior;
- new external services;
- dependency or infrastructure changes that affect architecture.

After completing or planning such a tweak, if the documentation has not already been updated, the AI must ask:

> **This change affects the app behavior/documentation. Do you want me to update `app-documentation/` so it stays the source of truth?**

Ask once per logical change set, not once per file.

For a purely cosmetic or implementation-only change that does not change behavior or contracts, the AI may state:

> **Documentation impact: none.**

### A change is not complete when documentation is knowingly stale.

If the user approves the documentation update, it should be made in the same work session/change set whenever possible.

---

## 4. Required AI Workflow

### 4.1 Before coding

The AI must:

1. Read the relevant files under `app-documentation/`.
2. Identify the feature or bounded area being changed.
3. Inspect the existing implementation before creating new abstractions.
4. Identify affected database tables, APIs, components, tests, and documentation.
5. Preserve existing features unless the user explicitly requests changes.
6. Avoid introducing new dependencies unless there is a clear need.

The AI must not begin by inventing a new architecture when the project already defines one.

### 4.2 During coding

The AI must:

- make the smallest coherent change that satisfies the requirement;
- keep business logic out of presentation components;
- reuse existing utilities and patterns;
- keep types and validation close to domain boundaries;
- preserve backwards compatibility unless a breaking change is explicitly intended;
- avoid opportunistic refactoring of unrelated code;
- avoid changing unrelated styles, routes, database fields, or behavior;
- add comments only when they explain *why*, not obvious *what*;
- leave the codebase cleaner but not unexpectedly different.

### 4.3 After coding

The AI must:

1. Run the appropriate type checks, linting, tests, and build checks.
2. Verify the affected user flow.
3. Verify mobile behavior for customer-facing UI.
4. Confirm secrets are not exposed.
5. Confirm migrations and RLS policies are included when required.
6. Confirm payment and webhook code is idempotent when relevant.
7. State what changed.
8. State any known limitation or unverified assumption.
9. Perform the documentation-impact gate.
10. Update the changelog when the change is material and documentation update is approved.

---

## 5. Scope Control

### Non-negotiable rule

**Do not touch unrelated features.**

A request to change checkout does not authorize:
- redesigning the admin;
- renaming unrelated database fields;
- replacing libraries;
- reformatting the whole codebase;
- changing authentication;
- modifying unrelated APIs.

If a related refactor is necessary to implement the requested change safely, explain the dependency and keep it narrowly scoped.

Avoid “while I am here” changes.

---

## 6. Approved Core Technology Stack

The default ALAS E-Commerce stack is:

| Layer | Technology |
|---|---|
| Application | Next.js 16 |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui where useful |
| Client state | Zustand |
| Guest cart persistence | Browser `localStorage` |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Realtime | Supabase Realtime only where justified |
| Payments | PayMongo |
| Validation | Zod |
| 3D | React Three Fiber + Three.js, lazy loaded |
| Hosting | Vercel or approved equivalent |

### Technology discipline

Do not add:
- Redis;
- another database;
- another auth provider;
- another state-management library;
- another backend framework;
- a message queue;
- microservices;

unless the current architecture can no longer satisfy a documented requirement and the change is explicitly approved.

**Redis is not required for the initial guest cart.** The guest cart stays in `localStorage`. Server-side infrastructure may be added later for needs such as high-volume reservations, rate limits, or distributed coordination.

---

## 7. Canonical Project Scaffolding

Use the following structure unless an approved ADR changes it:

```text
/
├── app-documentation/
│   ├── 00_README.md
│   ├── 01_TECH_STACK.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_UX_CHECKOUT.md
│   ├── 04_DATABASE.md
│   ├── 05_API_CONTRACTS.md
│   ├── 06_BUSINESS_RULES.md
│   ├── 07_SECURITY.md
│   ├── 08_TESTING.md
│   ├── 09_CHANGELOG.md
│   └── ADR/
│
├── src/
│   ├── app/
│   │   ├── (store)/
│   │   │   ├── page.tsx
│   │   │   ├── shop/
│   │   │   ├── collections/[slug]/
│   │   │   ├── products/[slug]/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   └── orders/track/
│   │   ├── (auth)/
│   │   ├── account/
│   │   ├── admin/
│   │   └── api/
│   │       ├── checkout/
│   │       ├── orders/
│   │       ├── payments/
│   │       └── webhooks/paymongo/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── commerce/
│   │   └── checkout/
│   │
│   ├── features/
│   │   ├── catalog/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── inventory/
│   │   └── payments/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── paymongo/
│   │   ├── env.ts
│   │   ├── money.ts
│   │   ├── logger.ts
│   │   └── validation/
│   │
│   ├── hooks/
│   ├── types/
│   └── styles/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── policies/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### Folder rules

- `src/app/`: routing, layouts, server entry points, and route handlers.
- `src/components/ui/`: reusable presentation primitives only.
- `src/features/`: domain behavior grouped by business capability.
- `src/lib/`: infrastructure and shared technical utilities.
- `src/types/`: genuinely shared application types; avoid turning it into a dumping ground.
- `supabase/migrations/`: all database schema changes.
- `app-documentation/`: intended behavior and architectural truth.
- `tests/`: behavior verification.

Do not create `utils2`, `helpers-new`, `misc`, `common-final`, or similar ambiguous folders.

---

## 8. Component Architecture

### Prefer server components by default

Use React Server Components unless browser-only behavior is required.

Use `"use client"` only for:
- interactive controls;
- Zustand stores;
- browser APIs such as `localStorage`;
- client-side animations;
- 3D rendering;
- UI requiring client state.

Do not convert large page trees to client components just because one child needs interactivity.

### Component responsibilities

A UI component should not:
- calculate authoritative prices;
- directly perform payment logic;
- contain database credentials;
- implement inventory transactions;
- duplicate server validation.

Prefer:
- small presentational components;
- feature-level containers;
- server-side domain services for authoritative operations.

---

## 9. TypeScript Rules

TypeScript is mandatory.

### Required

- enable strict mode;
- type public function inputs and outputs;
- use domain types instead of anonymous object shapes when reused;
- validate untrusted input with Zod;
- narrow `unknown` safely;
- use discriminated unions for finite state machines/statuses where useful.

### Avoid

- `any`;
- unsafe type assertions;
- duplicating database types by hand when generated types are available;
- optional fields when the domain requires a value;
- magic strings for statuses.

If `any` is unavoidable, it must be isolated and commented with the reason.

---

## 10. Naming Rules

Use predictable names.

### Files
- React components: `product-card.tsx`
- Stores: `cart-store.ts`
- Schemas: `checkout.schema.ts`
- Server services: `order.service.ts`
- Repositories only when a repository abstraction is actually needed.
- Route handlers: framework convention `route.ts`.

### Code
- components: `PascalCase`
- functions/variables: `camelCase`
- constants: `UPPER_SNAKE_CASE` only for true constants
- database: `snake_case`
- booleans: use `is`, `has`, `can`, `should`

Prefer domain language:
- `productVariant`
- `inventoryReservation`
- `paymentStatus`

Avoid vague names:
- `data`
- `info`
- `temp`
- `stuff`
- `handleThing`

unless local scope makes the meaning obvious.

---

## 11. Business Logic Rules

Business rules must live in one authoritative place.

Examples:
- shipping fee calculation;
- stock validation;
- price calculation;
- discount eligibility;
- order status transitions;
- inventory reservation expiration.

Do not duplicate these calculations across:
- product page;
- cart;
- checkout;
- admin;
- webhook.

The client may display estimates, but the server owns the final decision.

---

## 12. Guest Cart Constitution

The guest cart is intentionally simple.

### Storage

Use:

```text
Zustand + localStorage
```

Recommended storage key:

```text
alas_cart_v1
```

The cart should contain identifiers and enough display data for instant UI rendering.

### Persistence behavior

The cart must survive:
- page refresh;
- navigation;
- browser close/reopen;
- failed payment;
- return from PayMongo when payment is not confirmed.

### Security rule

Never trust client-side:
- price;
- discount;
- stock;
- shipping cost;
- total.

Before checkout/payment, the server must fetch authoritative data and recalculate the order.

### Inventory rule

**Adding to cart does not reserve stock.**

Reservation, if used, begins only during the documented checkout/payment stage and must expire.

### Cart clearing rule

Do not clear the cart merely because the customer reached a success URL.

Clear the purchased cart only after the application has authoritative confirmation that the order/payment succeeded.

---

## 13. Checkout Constitution

Guest checkout is a first-class flow.

### Do not require account creation

A guest may:
1. browse;
2. add items;
3. checkout;
4. provide contact and delivery details;
5. pay;
6. receive an order confirmation;
7. track the order.

Account creation may be offered after purchase or as an optional convenience.

### Collect only needed data

Recommended checkout fields:
- full name;
- email;
- mobile number;
- country;
- region;
- province;
- city/municipality;
- barangay;
- street/building/house address;
- postal code when applicable.

Do not ask for a password during guest checkout.

### Before payment

The server must revalidate:
- product existence;
- variant;
- stock;
- quantity;
- current price;
- discounts;
- shipping;
- final total.

If stock changed, show a human-readable correction instead of a raw backend error.

---

## 14. Money Rules

Never calculate money using floating-point arithmetic.

Preferred application representation:

```text
integer centavos
```

Example:

```text
₱899.00 = 89900 centavos
```

At database boundaries, use a documented consistent representation. Never mix pesos, centavos, formatted currency strings, and floating numbers without explicit conversion.

Every order must store an immutable commercial snapshot:
- item name;
- SKU/variant;
- size/color;
- unit price at purchase;
- quantity;
- discount;
- line total;
- shipping;
- final total.

Changing a product price later must not alter historical orders.

---

## 15. Database Constitution

### All schema changes require migrations

Never make undocumented manual production schema edits.

Each schema change must:
1. have a migration;
2. update the database documentation;
3. consider RLS;
4. consider indexes;
5. consider existing data;
6. include rollback/repair thinking where relevant.

### General conventions

- primary IDs: UUID unless a documented reason says otherwise;
- human-facing order number: separate from database ID;
- timestamps: timezone-aware;
- use foreign keys;
- use database constraints for invariants the database can enforce;
- avoid nullable columns when the domain requires a value;
- index fields used for common lookups and relations;
- use transactions for multi-step inventory/order operations.

### Never silently delete financial history

Orders, payments, refunds, and inventory movements should be auditable.

Prefer status changes or archival patterns over destructive deletion for financial records.

---

## 16. Supabase Security Constitution

Row Level Security is mandatory for exposed application tables.

### Never

- expose the Supabase service-role key in the browser;
- disable RLS as a shortcut;
- trust a client-provided user ID for authorization;
- let public users update protected order/payment records directly;
- store secrets in source control.

### Server-only secrets

The following must remain server-side:
- Supabase service-role secret;
- PayMongo secret key;
- webhook verification secret;
- private third-party credentials.

Environment variables must be documented in `.env.example` without real secret values.

---

## 17. PayMongo Constitution

Payment code is financial code and receives stricter treatment.

### Required flow

```text
Validated Checkout
    ↓
Create/prepare ALAS order
    ↓
Create PayMongo checkout/payment session
    ↓
Customer pays
    ↓
PayMongo webhook received
    ↓
Verify and process event
    ↓
Update payment/order atomically
    ↓
Clear purchased cart on confirmed success
```

### Non-negotiable rules

- never expose the PayMongo secret key client-side;
- never accept a price supplied by the browser as authoritative;
- never mark an order paid solely because the browser reached `/success`;
- verify webhook authenticity according to PayMongo's current documentation;
- make webhook processing idempotent;
- log provider transaction/reference IDs;
- safely handle duplicate webhook delivery;
- safely handle failed, cancelled, and abandoned payments;
- keep payment status separate from fulfillment/order status.

---

## 18. Order and Inventory Rules

Use clear status domains.

Example payment status:

```text
pending
paid
failed
refunded
partially_refunded
```

Example fulfillment/order status:

```text
pending
processing
packed
shipped
delivered
cancelled
```

Do not overload one status column to represent everything.

Inventory changes must be traceable.

Use stock movement/audit records for:
- sale;
- reservation;
- reservation release;
- cancellation;
- return;
- manual adjustment.

Avoid “set stock to X” without recording why the quantity changed.

---

## 19. API Constitution

All API endpoints must have:
- explicit input schema;
- explicit output shape;
- authorization rule;
- documented error behavior;
- validation;
- no leaked internal exception details.

Use consistent error responses.

Example:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Only 1 item is currently available."
  }
}
```

Do not return stack traces, SQL details, or provider secrets to users.

Whenever an API contract changes, update:

```text
app-documentation/05_API_CONTRACTS.md
```

---

## 20. Error Handling and Logging

### User-facing errors

Errors must be:
- understandable;
- actionable;
- non-technical;
- safe.

Example:

**Good:**  
“Large is almost sold out. We updated your quantity to 1.”

**Bad:**  
“409 INVENTORY_RESERVATION_CONSTRAINT_EXCEPTION”

### Internal logs

Log:
- request/correlation ID where useful;
- order ID;
- provider reference;
- important state transition;
- failure category.

Do not log:
- passwords;
- full payment credentials;
- secret keys;
- unnecessary personally identifiable information.

---

## 21. Performance Constitution

ALAS is mobile-first.

### Required mindset

- keep initial JavaScript small;
- use optimized images;
- lazy load non-critical features;
- lazy load the 3D product viewer;
- prefer server rendering for catalog content;
- avoid unnecessary client fetching;
- avoid unnecessary realtime subscriptions;
- prevent layout shifts;
- do not add animation that blocks customer actions.

### 3D rule

The 3D viewer is an enhancement, not a dependency for purchasing.

A customer with a slow device/network must still be able to:
- see normal product images;
- select a variant;
- add to cart;
- checkout;
- pay.

---

## 22. UI/UX Constitution

Every screen must answer:

1. Where am I?
2. What can I do here?
3. What is the primary action?
4. What happens next?

### Customer UX rules

- one clear primary CTA per decision area;
- never force login to buy;
- never erase a valid cart unexpectedly;
- do not bury size selection;
- show sold-out variants clearly;
- provide immediate add-to-cart feedback;
- keep checkout focused;
- avoid unnecessary fields;
- show totals clearly;
- show shipping cost as early as practical;
- use human language instead of system terminology;
- prioritize thumb-friendly mobile interactions.

---

## 23. Accessibility Baseline

At minimum:
- semantic HTML;
- keyboard-accessible controls;
- visible focus states;
- form labels;
- accessible validation messages;
- useful image alt text;
- sufficient contrast;
- buttons must be buttons, links must be links;
- modals/drawers must manage focus correctly.

Accessibility is part of correctness, not polish.

---

## 24. Testing Constitution

Every important business rule should be testable outside the UI.

### Unit tests

Use for:
- money calculations;
- discounts;
- cart transformations;
- status rules;
- shipping calculation;
- validation.

### Integration tests

Use for:
- database operations;
- order creation;
- inventory reservation;
- webhook processing;
- RLS-sensitive flows.

### E2E tests

Critical paths:
1. guest adds product;
2. refresh preserves cart;
3. quantity changes;
4. checkout revalidation;
5. out-of-stock correction;
6. guest detail submission;
7. payment creation;
8. payment webhook;
9. confirmed order;
10. cart cleared only after confirmed purchase;
11. guest tracks order.

A change that breaks a critical checkout path is not acceptable even if the UI looks correct.

---

## 25. Dependency Rules

Before adding a package, the AI must ask internally:

- Can the platform/framework already do this?
- Is this package maintained?
- Does it duplicate something installed?
- What bundle/server cost does it add?
- Does it introduce security risk?
- Is the functionality core enough to justify dependency?

Avoid packages for tiny utilities that can be implemented safely in a few lines.

Do not replace a working dependency only because another library is newer or more popular.

---

## 26. Refactoring Rules

Refactoring must preserve observable behavior unless behavior change is explicitly requested.

A refactor should:
- have a reason;
- stay scoped;
- maintain tests;
- not change public contracts accidentally.

Large refactors should be separate from feature changes whenever practical.

Never hide a breaking change inside “cleanup.”

---

## 27. Documentation Structure and Responsibilities

### `00_README.md`

Documentation index:
- what documents exist;
- where to find each rule;
- current application version;
- documentation conventions.

### `01_TECH_STACK.md`

Approved technologies and infrastructure.

### `02_ARCHITECTURE.md`

System boundaries, major components, data flow, hosting, integrations.

### `03_UX_CHECKOUT.md`

Customer journey, cart, checkout, payment, confirmation, tracking.

### `04_DATABASE.md`

Tables, relationships, constraints, indexes, RLS intent, important fields.

### `05_API_CONTRACTS.md`

Endpoints, inputs, outputs, auth requirements, webhook contracts.

### `06_BUSINESS_RULES.md`

Product, inventory, pricing, shipping, discount, order, cancellation and refund rules.

### `07_SECURITY.md`

Authentication, authorization, RLS, secrets, webhook security, sensitive data handling.

### `08_TESTING.md`

Test strategy and critical acceptance scenarios.

### `09_CHANGELOG.md`

Material product/architecture changes and corresponding documentation updates.

### `ADR/`

Architecture Decision Records for significant choices.

Examples:
- why guest cart uses localStorage;
- why PostgreSQL is authoritative;
- why Redis is deferred;
- payment architecture;
- 3D lazy-loading strategy.

---

## 28. Documentation Writing Rules

Documentation must describe current intended behavior, not abandoned ideas.

Use:
- concrete terms;
- exact route/table/status names;
- diagrams where useful;
- examples;
- acceptance rules.

Avoid:
- vague “maybe later” statements inside current requirements;
- contradictory duplicate rules;
- implementation details in the wrong document.

If a rule is replaced, update the canonical rule rather than appending contradictory paragraphs.

Historical decisions belong in ADRs/changelog.

---

## 29. Documentation Change Protocol

For every material change:

```text
User requests tweak
      ↓
AI reads relevant app-documentation
      ↓
AI implements/plans the change
      ↓
AI determines documentation impact
      ↓
If impacted:
"Do you want me to update app-documentation?"
      ↓
User approves
      ↓
Update canonical document(s)
      ↓
Update changelog if material
      ↓
Code + documentation are aligned
```

### Staleness prevention rule

If documentation is known to be outdated, the AI must not present it as reliable without noting the discrepancy.

If an implementation is changed but the documentation update is deferred, record that the documentation is pending and name the affected document(s).

---

## 30. Architecture Decision Records

Create an ADR when a decision:
- changes a major dependency;
- introduces infrastructure;
- changes storage strategy;
- changes payment architecture;
- changes authentication model;
- creates a cross-cutting pattern;
- is difficult or expensive to reverse.

Suggested format:

```text
# ADR-00X: Decision Title

Status: Accepted
Date: YYYY-MM-DD

## Context
Why is a decision needed?

## Decision
What are we doing?

## Consequences
What becomes easier/harder?

## Alternatives Considered
What did we reject and why?
```

Do not create ADRs for minor UI tweaks.

---

## 31. Git and Change Discipline

Prefer small, coherent commits.

Suggested commit style:

```text
feat(cart): persist guest cart in localStorage
fix(checkout): revalidate stock before payment
docs(checkout): update guest payment flow
refactor(order): centralize order total calculation
test(payment): cover duplicate webhook delivery
```

Never commit:
- `.env`;
- secret keys;
- generated credentials;
- debug dumps;
- large unexplained binaries.

Migration and corresponding code should be committed together.

Documentation changes that define the new behavior should accompany the functional change when approved.

---

## 32. Definition of Done

A feature/change is done only when applicable items are satisfied:

- [ ] Requirement is implemented.
- [ ] Existing unrelated behavior is preserved.
- [ ] TypeScript passes.
- [ ] Linting passes.
- [ ] Relevant tests pass.
- [ ] Production build passes.
- [ ] Mobile flow is verified.
- [ ] Server validates all untrusted input.
- [ ] No secrets are exposed.
- [ ] Database changes use migrations.
- [ ] RLS/security impact is reviewed.
- [ ] Payment changes handle idempotency and failure states.
- [ ] Critical user errors are human-readable.
- [ ] `app-documentation/` impact is assessed.
- [ ] Documentation is updated or explicitly marked pending.
- [ ] Material changes are entered in the changelog.

---

## 33. Forbidden Patterns

The AI must not:

- invent database columns without checking documentation/schema;
- invent APIs because they seem convenient;
- expose secrets to the client;
- disable RLS to make a feature work;
- trust client prices or totals;
- mark payments successful from a redirect alone;
- clear guest carts before confirmed purchase;
- require account creation for guest checkout;
- reserve stock when a product is merely added to cart;
- use floating-point arithmetic for money;
- duplicate business rules in multiple UI screens;
- add Redis or microservices without a justified approved requirement;
- perform broad unrelated refactors;
- silently change user-visible behavior;
- leave documentation knowingly stale without flagging it;
- claim a task is complete when critical checks were not performed.

---

## 34. AI Communication Protocol

When working on a task, communication should be concise and actionable.

### Before a significant implementation

State:
- what area is being changed;
- relevant documentation being followed;
- any important constraint.

### After implementation

Report:
- what changed;
- files/areas affected;
- checks performed;
- remaining limitation, if any;
- documentation impact.

### Required documentation question

For any functional tweak whose behavior is documented, if the docs were not already updated:

> **This tweak changes the documented behavior. Do you want me to update `app-documentation/` now so the documentation does not become stale?**

This question is part of the project's development process.

---

## 35. Constitutional Amendment Rule

This constitution may be changed only by an explicit user decision.

When a requested change conflicts with this constitution:
1. point out the conflict;
2. follow the user's explicit approved direction;
3. update this constitution if the user intends the new rule to be permanent;
4. update affected application documentation.

Do not silently weaken these rules.

---

# Final Principle

**ALAS should be easy for customers to use and easy for future developers and AI agents to understand.**

The application must have one coherent architecture, one documented set of business rules, and one maintained source of truth.

> **If the behavior changes, the documentation must be considered.  
> If the documentation changes, the implementation must be checked.  
> Code and `app-documentation/` must not be allowed to drift apart.**
