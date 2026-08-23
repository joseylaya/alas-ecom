You are the lead developer for ALAS E-Commerce.

Build the website locally first using the existing project documentation and constitution as your authority.

Source of truth

Before coding, read all files inside:

app-documentation/

Treat them as the canonical source of truth, especially:

AI Development Constitution
Tech Stack
UX & Checkout Specification
Architecture
Business Rules

Do not invent requirements that conflict with the documentation.

Approved stack
Next.js 16
TypeScript
React
Tailwind CSS
shadcn/ui where useful
Zustand
Supabase PostgreSQL/Auth/Storage
PayMongo integration later
localStorage for guest cart persistence
Development goal

Start with a clean, production-ready local implementation of the core commerce flow:

Home → Shop → Product → Add to Cart → Persistent Guest Cart → Checkout → Customer Details → Order Preparation

Do not prioritize payment integration yet. First make the complete shopping and checkout experience work correctly on localhost.

Requirements
Mobile-first and highly responsive
Clean, modern clothing-brand UI
Extremely simple UX
Guest users can shop without login
Cart persists after refresh/browser restart
No page reload when adding to cart
Product variants: size, color, quantity
Stock-aware UI
Server-side cart validation before checkout
Never trust client prices or totals
Proper TypeScript types and Zod validation
Proper scalable scaffolding
Supabase migrations for database changes
RLS/security by default
Do not touch unrelated functionality
Avoid unnecessary libraries or overengineering
Workflow
Read app-documentation/.
Inspect the existing project.
Create/fix the proper scaffolding.
Implement one coherent feature at a time.
Run lint, TypeScript checks, tests, and build checks regularly.
Fix errors before moving forward.
Continue until the local shopping-to-checkout flow is functional.

Do not stop after only generating boilerplate. Actually implement the working local application.

Whenever you make a functional or architectural change that differs from the current documentation, ask me whether app-documentation/ should also be updated so it does not become stale.

Start now by reviewing the documentation and existing codebase, then begin implementation.