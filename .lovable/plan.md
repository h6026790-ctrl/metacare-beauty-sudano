## Phase 1 — Visitor Experience

Scope: public/unauthenticated surface only. Fully compliant with `docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md`. No changes to auth, customer/staff/admin workspaces, DB, RLS, business rules, or inventory.

### 1. Public Navigation

Update `Header.tsx` visitor-mode nav:
- Home, Shop, Categories, Brands, Offers, About, Contact
- Right side: Search, Login, Register (visitor); Account/Cart/Wishlist remain for authenticated users only.
- Mobile: refined bottom-safe sheet menu, larger tap targets, sticky "Register" CTA in drawer.
- Hide wishlist/cart icons for visitors (they're customer-only per blueprint).

### 2. New Public Routes

Create:
- `src/routes/about.tsx` — brand story, mission, values, team snapshot, Wad Madani coverage.
- `src/routes/contact.tsx` — WhatsApp, phone, hours, location map placeholder, contact form (mailto/wa.me only — no backend).
- `src/routes/faq.tsx` — delivery, payment, returns, registration approval, pricing visibility.
- `src/routes/policies.privacy.tsx`, `src/routes/policies.terms.tsx`, `src/routes/policies.returns.tsx` — legal/trust content.
- `src/routes/delivery.tsx` — delivery coverage & timing.

Each with proper `head()` meta (title, description, og:*). No og:image on root.

### 3. Home Page Redesign (`src/routes/index.tsx`)

Restructure as full marketing landing page:
1. Hero (existing, refined CTA → Register / Shop)
2. Trust strip (authenticity, delivery, WhatsApp, secure payment) — moved up
3. Featured Categories grid
4. Featured Brands strip
5. New Arrivals carousel
6. Best Sellers
7. Current Offers banner → `/offers`
8. Why Choose Metacare (value props with icons + copy)
9. Testimonials placeholder (future-ready, static seed for now, dismissable if empty)
10. Delivery Info section (Wad Madani, timing, WhatsApp coordination)
11. FAQ preview (3 items → link to `/faq`)
12. Contact strip (WhatsApp CTA, hours)
13. Footer (enhanced — see below)

### 4. Product Browsing (visitor-gated)

- `products.tsx`, `products.$id.tsx`, `search.tsx`, `categories.tsx`, `brands.tsx`, `brands.$id.tsx`, `offers.tsx`: keep functionality; ensure:
  - `PricePill` already handles login-gated pricing ✓ (no change).
  - Hide "Add to cart" and wishlist buttons for visitors on `ProductCard` and PDP — replace with a single **"Sign in to view pricing"** CTA button.
  - PDP: remove inventory badges/stock counts for visitors; hide "related product prices"; add a share button (Web Share API + copy link fallback).
  - Add sticky bottom "Register to purchase" CTA on PDP for visitors (mobile).

### 5. Registration Entry Points

Add contextual CTAs throughout visitor experience:
- Hero primary CTA → `/auth` (Register tab).
- Every hidden price → already routes to `/auth` via PricePill.
- PDP sticky bottom bar (visitor only).
- Offers page banner.
- Home "Why Metacare" section ends with Register CTA.
- Footer includes "Create account" link.

### 6. Enhanced Footer (`Footer.tsx`)

Restructure into columns:
- Brand + tagline + WhatsApp button
- Shop links (Categories, Brands, Offers, New)
- Company (About, Contact, Delivery, FAQ)
- Legal (Privacy, Terms, Returns)
- Language switcher + copyright

### 7. i18n

Add AR/EN strings for: About, Contact, FAQ, Delivery, Policies pages, new CTAs, footer columns, "Sign in to view pricing" variants. Extend `dict.ts`.

### 8. Mobile-First Refinements

- Larger tap targets (min 44px) on all CTAs.
- Sticky mobile CTA bar on PDP for visitors.
- Bottom sheet menu with Register highlight.
- Reduce hero heading size on mobile, keep readable line-height.
- Responsive grid: 2 cols mobile → 3 tablet → 4 desktop (already in place, verify all pages).

### 9. Files to Create

```
src/routes/about.tsx
src/routes/contact.tsx
src/routes/faq.tsx
src/routes/delivery.tsx
src/routes/policies.privacy.tsx
src/routes/policies.terms.tsx
src/routes/policies.returns.tsx
src/components/visitor/VisitorPDPCta.tsx   (sticky register bar)
src/components/visitor/WhyMetacare.tsx
src/components/visitor/TestimonialsPlaceholder.tsx
src/components/visitor/DeliveryStrip.tsx
src/components/visitor/FAQPreview.tsx
```

### 10. Files to Edit

```
src/routes/index.tsx           — new home structure
src/routes/products.$id.tsx    — visitor CTA, hide stock/related prices
src/components/layout/Header.tsx — visitor-mode nav, About/Contact links, hide wishlist/cart for visitors
src/components/layout/Footer.tsx — full restructured footer
src/components/ProductCard.tsx  — visitor CTA state
src/i18n/dict.ts                — new strings
```

### Explicitly NOT Touched

- `src/routes/auth.tsx`, `account.*`, `admin.tsx`, `staff.tsx`, `cart.tsx`, `checkout.tsx`, `orders.*`
- Any `src/lib/api/*.functions.ts` (no backend changes)
- Any migration, RLS, or DB object
- `src/integrations/supabase/*`

### Deliverables (after build)

Post-implementation report covering: visitor navigation map, home structure, public route map, registration conversion touchpoints, mobile summary, accessibility notes (RTL, semantic landmarks, alt text, focus rings, tap sizes), and UAT scenarios (browse → PDP → hidden price → register → login → account).
