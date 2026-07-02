# Metacare Beauty — Project Blueprint

**Document type:** Product Specification & System Architecture Reference
**Version:** 1.0 (post Phase 2.5 — Production Integration)
**Status:** Pre-launch, Wad Madani pilot
**Audience:** Future developers, designers, AI systems, investors, project managers

---

## 1. Executive Summary

### What Metacare Beauty Is
Metacare Beauty is a Sudan-based, Arabic-first e-commerce platform for **medical-grade and luxury beauty products**. It blends the credibility of a dermatology clinic with the polish of a high-end beauty retailer. The platform is operational software, not a brochure: it ingests orders, routes them through a human customer-service desk, coordinates external couriers (not system users), and tracks every state change through a full audit trail.

### Business Goals
- Become the trusted destination in Sudan for authentic, medically-credible beauty products.
- Replace WhatsApp-only retail with a structured catalogue, real inventory, and traceable orders — while keeping WhatsApp as the human communication channel customers already trust.
- Build operational discipline (assigned staff, audit logs, QR-confirmed deliveries) from day one so the same platform scales to the entire country without re-architecture.

### Target Audience
- **Primary:** Sudanese women aged 20–45 in urban centres, smartphone-first, Arabic-native, brand-aware, willing to pay for authenticity.
- **Secondary:** Clinics, salons, and resellers who need a reliable wholesale-grade supply of trusted brands.
- **Tertiary (future):** Diaspora customers ordering for family inside Sudan.

### Launch Strategy
- **Phase 1 city:** Wad Madani (Gezira State) only. One city, one cutoff, one delivery rotation — small enough to perfect operations.
- **Payments:** Bank of Khartoum transfer + manual confirmation by Customer Service via WhatsApp. No card processing in v1.
- **Channel mix:** Organic + Instagram + WhatsApp Business broadcast.

### Expansion Strategy
- Geography is data-driven (`states / cities / neighborhoods` tables with per-neighbourhood delivery fees). Adding Khartoum, Port Sudan, Atbara etc. is a SQL insert, not a code change.
- Operationally, expansion is gated on: (a) a local trusted external courier list, (b) a CS staff member assigned to that region, (c) verified delivery fees per neighbourhood.

---

## 2. Brand Identity

### Brand Positioning
"Medical beauty, beautifully delivered." Metacare sits at the intersection of a dermatology clinic and a luxury concept store. Trust > novelty. Authenticity > discount.

### Luxury + Medical Beauty Concept
- **Medical** signals: clean typography, clinical whitespace, deep medical blue, restrained iconography, no marketing hype copy.
- **Luxury** signals: serif display font for moments of emphasis, generous spacing, calm photography, soft cyan/violet accents, deliberate motion.

### Design Philosophy
- Calm, confident, never loud. The product is the hero; chrome recedes.
- One typographic moment per screen, not five.
- Negative space is a feature, not wasted real estate.
- Every interactive element answers "what happens next?" before the tap.

### Visual Language
- **Palette:** Deep medical blue → cyan gradient on soft white. Subtle violet accents for premium moments. Status colours reserved for state (success, warning, danger) and never for decoration.
- **Typography:** Tajawal (Arabic UI), Instrument Serif (display), Inter (Latin body).
- **Iconography:** Single-weight line icons; no filled glyphs in body content.
- **Motion:** Short, eased, purposeful — page transitions, add-to-cart confirmations, status pulses.

### Arabic-First Strategy
- Arabic is the **default language**, RTL is the **default direction**. English is a secondary toggle, not the source of truth.
- Numerals: SDG with locale-aware formatting. Both Arabic and Western numerals are tolerated in inputs (phone, OTP).
- Every string has an Arabic counterpart in `src/i18n/dict.ts`; English translations follow, never lead.

### Mobile-First Strategy
- All layouts are designed at 360–430 px first; desktop is a graceful expansion.
- Touch targets ≥ 44 px, sticky checkout/cart actions, thumb-reachable primary CTAs.
- Network-aware: aggressive image compression, skeleton states, optimistic UI for cart/wishlist.

---

## 3. Customer Experience Vision

### Desired Customer Journey
1. **Discover** — Land on the home page (featured, new arrivals, best sellers, brands) without login.
2. **Browse** — Explore by category, brand, search, or offers. Prices are masked behind a login prompt.
3. **Register** — Tap a price → mobile-number OTP → minimal profile (name, address) → returned to the same product.
4. **Decide** — See price, read description, add to wishlist or cart.
5. **Checkout** — Confirm address (Wad Madani neighbourhoods only in v1), receive Bank of Khartoum transfer instructions, get a WhatsApp deep-link to CS.
6. **Confirm** — CS verifies the bank transfer, moves order to **Paid**.
7. **Deliver** — Staff coordinates an external courier via WhatsApp and marks the order **Out for Delivery** (this generates a QR token). The courier delivers; the customer opens their order page and scans / enters the QR token → **Delivered**.
8. **Reorder** — Account page shows order history, repeat-order shortcut, persistent wishlist.

### Shopping Experience Principles
- Login is **never** required to browse.
- Login **is** required to see prices, add to cart, or check out.
- The cart and wishlist survive logout and follow the user across devices.
- No dark patterns — no fake countdowns, no forced upsells, no hidden fees.

### Login & Registration Philosophy
- One identity method: **mobile number + OTP**. No passwords, no email-first flows.
- The phone number is the user's permanent ID and the WhatsApp channel.
- Profile completion (name, default address) is required before checkout, not before browsing.

### Pricing Visibility Rules
- **Anonymous users:** see catalogue, see "Login to view price" pill via `<PricePill />`. Structured data still exposes the product to search engines for SEO.
- **Authenticated users:** see full price, compare-at price, totals.
- Prices are never split into "online" vs "in-store" — one price, one source of truth.

### Product Presentation Rules
- Every product has: Arabic + English name, Arabic + English description, brand, category, primary image, optional gallery, price (SDG), optional compare-at price.
- Product flags drive merchandising surfaces: `is_featured`, `is_new`, `is_best_seller`.
- Out-of-stock products **remain visible** — they show "غير متوفر حالياً" / "Out of stock" and disable the add-to-cart button. They are never hidden from search or category pages.

### Inventory Visibility Rules
- **Customers never see stock quantities.** Only two states are exposed:
  - "متوفر" / "In stock" — `stock > 0`
  - "غير متوفر حالياً" / "Currently unavailable" — `stock = 0`
- Staff & admin dashboards see real numbers and low-stock alerts.

---

## 4. Site Architecture

### Public pages (anonymous-accessible)
```
/                          Home — hero, featured, new arrivals, brands, categories, best sellers, trust strip
/products                  Shop — filterable by category / brand
/products/:id              Product detail (price gated)
/categories                Category landing
/brands                    Brand index
/brands/:id                Brand detail
/offers                    On-sale collection
/search?q=                 Search results
/sitemap.xml               Generated sitemap (server route)
```

### Authentication
```
/auth                      Mobile + OTP (sign in / register tabs)
```

### Customer pages (login required)
```
/cart                      Cart
/checkout                  Checkout (Wad Madani only in v1)
/orders/:id                Order detail + status timeline + QR for delivery confirmation
/account                   Profile, addresses, order history
/account/wishlist          Wishlist
```

### Admin pages (role: `admin`)
```
/admin                     Overview, Orders, Products, Catalog (brands + categories),
                           Customers, Team (staff + admins), Content, Reports
```

### Customer Service pages (role: `staff`)
```
/staff                     Assigned-orders queue, master/detail view,
                           confirm payment, mark Out for Delivery, internal notes, WhatsApp shortcut
```

### Delivery workflow (no dedicated dashboard — handled inside Staff panel)
```
                           call/WhatsApp/map shortcuts, completed-today log
```

Robots/SEO: `/admin`, `/staff`, the Staff panel, `/account`, `/checkout`, `/cart`, `/auth` are disallowed in `public/robots.txt`. Public pages are sitemap-indexed.

---

## 5. Database Architecture

All tables live in `public` schema, RLS-enabled, with explicit GRANTs per migration.

### Enums
- `app_role`: `admin | staff | customer`
- `order_status`: `new | review | paid | shipping | delivered | cancelled | returned`

### Tables

**Geography** (multi-state ready)
- `states` — id, name_ar/en, is_active, sort_order
- `cities` — id, state_id, name_ar/en, is_active, sort_order
- `neighborhoods` — id, city_id, name_ar/en, **delivery_fee_sdg**, is_active, sort_order

**Catalog**
- `brands` — id, slug, name_ar/en, tagline_ar/en, logo_url, is_active, sort_order
- `categories` — id, slug, name_ar/en, icon, is_active, sort_order
- `products` — id, brand_id, category_id, slug, name_ar/en, description_ar/en, price_sdg, compare_at_sdg, image_url, is_featured, is_new, is_best_seller, **is_active** (soft-delete flag), created_at, updated_at
- `product_images` — id, product_id, url, sort_order
- `inventory` — product_id (PK), stock, updated_at

**Identity**
- `profiles` — id (= auth.users.id), full_name, phone, whatsapp
- `user_roles` — id, user_id, role (separate table — never on profiles)
- `addresses` — id, profile_id, state_id, city_id, neighborhood_id, street, notes, is_default

**Commerce**
- `carts` — id, profile_id (unique)
- `cart_items` — (cart_id, product_id) PK, qty
- `wishlists` — (profile_id, product_id) PK
- `orders` — id, **number** (`MCyymmdd-####`), profile_id, **assigned_staff_id**, status, subtotal_sdg, delivery_sdg, total_sdg, contact_* + address_* snapshot, cutoff_bucket, placed_at, archived_at
- `order_items` — id, order_id, product_id, **name_snapshot**, qty, price_sdg
- `order_status_history` — id, order_id, status, actor_id, note, at (append-only)
- `order_notes` — id, order_id, author_id, body, created_at (staff-only)
- `delivery_assignments` — id, order_id (unique), agent_id (nullable, deprecated — couriers are external), assigned_by, **qr_token**, **qr_expires_at** (24h default), assigned_at, completed_at
- `notifications` — id, profile_id, channel, template, payload, sent_at

**Audit**
- `audit_logs` — id, actor_id, action, entity_type, entity_id, metadata (jsonb), at

### Relationships (high-level)
```
auth.users 1—1 profiles, 1—n user_roles
profiles 1—n addresses, 1—1 carts, 1—n wishlists, 1—n orders
states 1—n cities 1—n neighborhoods
brands 1—n products n—1 categories
products 1—1 inventory, 1—n product_images
orders 1—n order_items, 1—n order_status_history, 0..1 delivery_assignments, 1—n order_notes
```

### Triggers
| Trigger | Fires on | Effect |
|---|---|---|
| `handle_new_user` | `auth.users INSERT` | Creates profile, grants `customer` role |
| `set_order_number` | `orders BEFORE INSERT` | Assigns `MCyymmdd-####` |
| `handle_order_status_change` | `orders INSERT/UPDATE` | Writes status history + audit log; **decrements inventory only on transition INTO `paid`**; **restores stock** on `→ returned` (from paid/shipping/delivered) or `→ cancelled` (from paid/shipping only) |
| `audit_product_change` | `products INSERT/UPDATE/DELETE` | Audit log entry |
| `audit_inventory_change` | `inventory UPDATE` | Audit log entry |
| `audit_delivery_assignment` | `delivery_assignments INSERT/UPDATE` | Audit log entry |
| `touch_updated_at` | `profiles/products BEFORE UPDATE` | Maintains `updated_at` |

### Security-Definer Helpers
- `has_role(uid, role)` — non-recursive role check used by every policy that gates by role.
- `is_staff_or_admin(uid)` — convenience wrapper for order/audit/staff policies.
- `confirm_delivery_by_qr(_order_id, _token)` — atomic RPC: validates order ownership, token match, non-completed state, and expiry → marks delivered.

### RLS Strategy
- Every table has RLS enabled.
- Policies always go through `has_role` / `is_staff_or_admin` to avoid recursion against `user_roles`.
- Public catalog tables (`brands`, `categories`, `products`, `product_images`, `inventory`, geography) are publicly readable for active rows; admin-only for writes.
- Customer-owned tables (`carts`, `cart_items`, `wishlists`, `addresses`, `profiles`) gate by `auth.uid()`.
- Orders are visible to: the owning customer, admins (all), staff (only when `assigned_staff_id = auth.uid()`), assigned external couriers (not system users).
- `audit_logs`, `order_notes` are staff/admin readable; writes are trigger-driven or staff-authored.

### Audit Architecture
Every business-critical mutation produces an `audit_logs` row:
- Order created / status changed
- Inventory decremented (on paid) / restored (on returned or cancelled-after-paid) / manual admin adjustment
- Product created / updated / soft-deleted / restored
- Delivery assignment created / updated
- Role granted / revoked

Audit rows are append-only — there is no UPDATE or DELETE policy on `audit_logs`.

---

## 6. User Roles & Permissions

Roles live in `public.user_roles`; one user may hold multiple. Default role on signup: `customer`.

| Capability | Customer | Agent | Staff (CS) | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse catalog | ✓ | ✓ | ✓ | ✓ |
| See prices | ✓ (auth) | ✓ | ✓ | ✓ |
| Manage own cart / wishlist | ✓ | ✓ | ✓ | ✓ |
| Place orders | ✓ | ✓ | ✓ | ✓ |
| View own orders | ✓ | ✓ | ✓ | ✓ |
| View all orders | — | — | only assigned | ✓ |
| View assigned deliveries | — | own | ✓ | ✓ |
| Move order new → review → paid → shipping | — | — | ✓ (assigned) | ✓ |
| Confirm payment (→ paid) — triggers stock decrement | — | — | ✓ | ✓ |
| Cancel / refund order | — | — | ✓ | ✓ |
| Manually assign external courier | — | — | ✓ | ✓ |
| Mark delivered via QR scan | — | ✓ (own) | ✓ | ✓ |
| Read audit logs | — | — | ✓ | ✓ |
| Manage products / brands / categories | — | — | — | ✓ |
| Soft-delete / restore products | — | — | — | ✓ |
| Adjust inventory | — | — | — | ✓ |
| Grant / revoke roles | — | — | — | ✓ |
| Manage geography | — | — | — | ✓ |

Role lifecycle:
- **Customer** — automatic on signup (`handle_new_user` trigger).
- **Agent / Staff / Admin** — granted by admin via `adminSetUserRole` (writes `user_roles` + `audit_logs`).

---

## 7. Product Management Model

### Products
- One row per SKU. Names and descriptions are bilingual (AR/EN).
- Flags drive merchandising: `is_featured`, `is_new`, `is_best_seller`.
- `is_active = false` is the **only** removal path. Hard delete is intentionally not exposed.

### Brands & Categories
- Curated by admin. Bilingual names, slugs for SEO-friendly URLs, optional icons/logos.
- Soft `is_active` flag hides without deleting.

### Inventory
- One `inventory` row per product (`product_id` PK).
- Stock is mutated by exactly two paths:
  1. The `handle_order_status_change` trigger (on order status transitions).
  2. Admin manual adjustment via `adminAdjustStock` (audited).
- Checkout **does not** touch inventory.

### Stock Management Rules
- Decrement: only on `→ paid`.
- Restore: on `→ returned` (only if previous status ∈ {paid, shipping, delivered}); on `→ cancelled` (only if previous status ∈ {paid, shipping}). Cancellations before payment do not double-restore.
- Floor: stock cannot go below 0 (`GREATEST(stock - qty, 0)`).

### Availability Logic
- Customer-facing: `stock > 0` → "متوفر"; `stock = 0` → "غير متوفر حالياً".
- Add-to-cart is disabled when stock is 0; the product remains visible.
- Staff/admin dashboards show actual counts and low-stock alerts (≤3).

---

## 8. Authentication Architecture

### OTP Workflow
1. Customer enters mobile number on `/auth`.
2. Supabase Auth (`signInWithOtp` over SMS) sends a 6-digit code via the configured SMS provider (Twilio for production).
3. Customer enters the code; Supabase issues a session.
4. `handle_new_user` trigger ensures a `profiles` row and a `customer` role exist.
5. The user is redirected back to the page they came from (typically a product detail).

### User Creation
- A single `auth.users` row per phone number.
- The trigger guarantees the linked `profiles` + `user_roles` rows on first sign-in.

### Profile Completion
- Full name is requested on the first successful sign-in.
- A default address (state → city → neighbourhood + street) is required before the first checkout.
- Profile and addresses are editable from `/account`.

### Session Handling
- Sessions are persisted in `localStorage` by the Supabase browser client.
- The TanStack Start server functions receive the session via `attachSupabaseAuth` middleware, which forwards the bearer token automatically.
- `requireSupabaseAuth` middleware re-validates the JWT server-side on every protected RPC.

### Future Provider Integration
- Email/password and Google OAuth are deliberately deferred until v2 to avoid identity fragmentation.
- WhatsApp Cloud API integration (Phase 4) will replace SMS OTP for cost reasons once the business account is approved.

---

## 9. Order Management Workflow

### Lifecycle
```
new  →  review  →  paid  →  shipping  →  delivered
                              ↘  cancelled
                              ↘  returned
```

| Transition | Trigger | Who | Inventory effect | Audit |
|---|---|---|---|---|
| (create) → `new` | Customer checkout | Customer | none | `order.created` |
| `new` → `review` | CS opens order | Staff/Admin | none | `order.status_changed` |
| `review` → `paid` | CS confirms bank transfer | Staff/Admin | **decrement** for each item | `order.status_changed` + `inventory.decremented` (per item) |
| `paid` → `shipping` | Staff dispatches order | Staff/Admin | none | `order.status_changed` |
| `shipping` → `delivered` | Agent QR scan via `confirm_delivery_by_qr` RPC | Agent (with customer-shown QR) | none | `order.status_changed` + `delivery.updated` |
| any → `cancelled` | CS/Admin cancels | Staff/Admin | **restore** only if previous ∈ {paid, shipping} | `order.status_changed` + (conditional) `inventory.restored` |
| `delivered` → `returned` | CS processes return | Staff/Admin | **restore** | `order.status_changed` + `inventory.restored` |

### Order Number
Generated by `set_order_number` trigger: `MCyymmdd-####`, sequential within the day's `cutoff_bucket`.

### Snapshots
At order time, each line stores `name_snapshot` and `price_sdg`. The order remains accurate even if the underlying product is renamed, repriced, or soft-deleted later.

---

## 10. Customer Service Workflow

### Assignment Model
- New orders land unassigned (`assigned_staff_id IS NULL`) and are visible only to admins.
- An admin (or, in v2, a queue distributor) sets `assigned_staff_id` to a staff user.
- From that moment, only the assigned staff member (and admins) can see or update the order — enforced by RLS, not just UI.

### Order Ownership
- One staff member owns the order from `review` through delivery dispatch.
- Reassignment is an admin action and is audited.

### Payment Verification
1. Customer initiates checkout → order created with `status = new`.
2. Checkout page shows Bank of Khartoum transfer details (hardcoded in i18n dictionary in v1) and a WhatsApp deep-link to CS.
3. Customer sends payment proof on WhatsApp.
4. Staff opens the order → moves to `review` → upon verifying the transfer in the bank app, moves to `paid`.
5. The `→ paid` transition decrements inventory automatically.

### Internal Notes
- `order_notes` table — visible only to staff/admin.
- Author is always `auth.uid()`; rows are append-only.

### WhatsApp Communication
- Every order page exposes a `wa.me` deep-link to the customer's WhatsApp number with a pre-filled message containing the order number.
- The business WhatsApp number is in `src/lib/config.ts` (`METACARE_WHATSAPP`) — placeholder until the operator provides the real number.

### Delivery Assignment
- After `paid`, staff manually selects an available external courier → inserts a `delivery_assignments` row.
- This is **never automatic**. The platform deliberately requires a human decision.
- The assignment generates a `qr_token` (24h expiry) used by the customer to confirm receipt from their order page.

---

## 11. Delivery Workflow

### Delivery Dashboard (the Staff panel)
- "Today's jobs": the delivery assignment records the assigned staff created; there is no dedicated agent dashboard.
- Per order: customer name, phone, WhatsApp, address snapshot, map deep-link, call shortcut.
- Completed-today log: visible at the bottom for end-of-day reconciliation.

### Assignment Logic
- Assignments are created by staff after payment confirmation (see §10).
- One assignment per order (unique `order_id` constraint on `delivery_assignments`).
- Reassignment in v1 = staff deletes-and-recreates is not allowed (DELETE is denied); instead, the assignment is updated. Token rotation on reassignment is a Phase 3 enhancement.

### QR Workflow
1. Customer opens their order page → it shows a QR encoding `{order_id, qr_token}`.
2. Agent arrives, opens the Staff panel, taps the order, scans the customer's QR.
3. Frontend calls `confirmDeliveryQr({orderId, token})` server function → `confirm_delivery_by_qr` RPC.
4. RPC validates: order exists, customer is the order owner, token matches, not already completed, not expired (24h).
5. On success: `delivery_assignments.completed_at = now()`, `orders.status = 'delivered'`.

### Delivery Confirmation
- The QR scan is the only "delivered" path. There is no manual "mark delivered" button — this prevents fraud and accidental status updates.
- Staff/admin retain the ability to set `delivered` via the operations dashboard for edge cases (e.g. lost QR), and every such override is audited.

### Return Handling
- Customer requests return via WhatsApp.
- Staff moves the order `delivered → returned`. Trigger restores inventory and writes an audit row.
- Physical product handling is operational (out of scope for v1 software).

---

## 12. Security Architecture

### Row-Level Security
- RLS is enabled on every public table.
- All policies use `has_role` / `is_staff_or_admin` security-definer helpers to avoid recursive evaluation against `user_roles`.
- Explicit GRANTs are in every migration — no reliance on default privileges.

### Role Enforcement
- Roles are stored in a dedicated `user_roles` table, never on `profiles`. This prevents the classic privilege-escalation pattern.
- Client-side role checks are advisory only. Every privileged server function calls `assertAdmin` / `assertStaff` / `assertAgent`, which reads `user_roles` server-side.

### Audit Logging
- Triggers write `audit_logs` rows for orders, inventory, products, deliveries.
- Admin server functions write explicit audit rows for role changes.
- Audit rows are append-only (no UPDATE/DELETE policy).

### Data Isolation
- Customers can only read/write their own profile, addresses, cart, wishlist, orders, order items, and status history.
- Staff see only orders explicitly assigned to them.
- Agents see only deliveries explicitly assigned to them.
- Admins are the only role with cross-tenant visibility.

### Inventory Protection
- Inventory is never decremented from client code or from checkout.
- Only the `handle_order_status_change` trigger (paid transition) and the admin `adminAdjustStock` server function can mutate stock.
- The trigger uses `GREATEST(stock - qty, 0)` to make negative stock structurally impossible.

### Other Hardening
- Trigger functions are revoked from `PUBLIC` / `anon` / `authenticated` — only triggers (running as table owner) can call them.
- All `SECURITY DEFINER` functions pin `search_path = public`.
- QR tokens are 16 random bytes (`gen_random_bytes(16)`), 24-hour TTL, single-use (completed_at gates reuse).
- No service-role key in client code. The browser uses the publishable key; the server uses `requireSupabaseAuth` for user context or `supabaseAdmin` (service role) only inside verified server routes.

---

## 13. Reporting & Analytics

### Current Reports (via `adminReports`)
- Revenue (last 30 days; orders in paid/shipping/delivered count)
- Order count (last 30 days)
- Order mix by status
- Total customers
- Active vs archived (soft-deleted) products
- Low-stock list (top 20 with `stock ≤ 3`)

### Future Reports (Phase 3+)
- Per-staff productivity (orders processed, average time-to-paid, average time-to-delivered)
- Per-order delivery throughput
- Per-product velocity & stock-out frequency
- Per-neighbourhood demand heatmap
- Cohort retention (repeat-order rate by signup month)
- Funnel analytics (view → cart → checkout → paid)

### Operational KPIs
- Time-to-confirm-payment (CS SLA)
- Time-to-deliver (per neighbourhood)
- Order cancellation rate (and reason taxonomy — Phase 3)
- Stock-out rate per SKU
- Customer-service contact rate per order (signal for UX friction)

---

## 14. Current Implementation Status

### Implemented
- **Brand & UI:** Arabic-first, RTL, mobile-first storefront, full design system, all customer pages.
- **Auth:** Mobile + OTP via Supabase Auth, profile auto-creation, role bootstrap.
- **Catalog:** Brands, categories, products, product images, inventory — fully wired to Supabase, seeded with 18 products / 6 brands / 4 categories.
- **Cart / Wishlist:** Persisted per user via Supabase, optimistic UI through React Query.
- **Checkout:** Address selection (Wad Madani neighbourhoods), Bank of Khartoum instructions, WhatsApp handoff.
- **Order lifecycle:** Full status machine + triggers (status history, inventory decrement on paid, restore rules).
- **Audit logs:** Triggers + explicit server-function writes for role changes.
- **Staff dashboard:** Assigned-orders queue, payment confirmation, internal notes, Out-for-Delivery handoff.
- **Delivery dashboard:** Today's jobs, QR confirmation via `confirm_delivery_by_qr` RPC.
- **Admin dashboard:** Orders, products (incl. soft-delete / restore), inventory adjustment, role management, brand/category management, audit log viewer, 30-day reports.
- **Security:** RLS on all tables, security-definer role helpers, append-only audit, server-side role gates.
- **SEO:** robots.txt, sitemap server route, per-route head metadata.

### Partially Implemented
- **Bank transfer instructions:** Hardcoded placeholder in i18n dictionary (`src/lib/config.ts`). Needs real account number/IBAN from operator.
- **WhatsApp business number:** Placeholder in `METACARE_WHATSAPP`. Needs real number.
- **SMS provider:** Twilio integration must be configured in Supabase Auth settings before OTP works in production.
- **Admin reports UI:** `adminReports` server function exists; the admin dashboard surfaces KPIs but doesn't yet render the full charts roadmap.
- **Customer QR display on order page:** RPC is live; the customer-facing QR component needs final polish.
- **Initial admin user:** No admin role granted yet — requires a one-time SQL grant once the operator's phone number is provided.

### Pending
- Twilio OTP credentials & SMS template approval.
- WhatsApp Business Cloud API onboarding (Phase 4).
- Product photography refresh (replace prototype imagery).
- Reassignment / token-rotation flow for external couriers (not system users).
- Daily cutoff job (06:00) and 3-day terminal-state auto-archive job.
- Customer return-request UI (currently WhatsApp only).
- Notifications fan-out (`notifications` table is staged but no sender wired).

---

## 15. Future Roadmap

### Remaining Work Before Launch
1. Operator inputs: Twilio creds, WhatsApp business number, Bank of Khartoum account details, first admin phone number.
2. Grant the first admin role via SQL.
3. End-to-end smoke test: signup → browse → checkout → CS verifies payment → marks Out for Delivery → customer QR-confirms receipt → delivered.
4. Replace placeholder product photography with operator-provided assets.
5. Final pass on Arabic copy with the operator's preferred tone.
6. Production publish and DNS / custom domain setup.

### Phase 3 — Operations Maturity
- Per-staff queue distribution (round-robin or load-aware) instead of admin-only assignment.
- Daily 06:00 reset job + 3-day terminal-state auto-archive.
- Configurable daily cutoff (admin setting).
- Reassignment workflow for external couriers (not system users) with QR token rotation.
- Customer self-service: address book, cancel-while-new, return request.
- Full reports suite (per-staff, per-product, per-neighbourhood).
- Inventory low-stock alerts → admin notification channel.
- Image storage in Supabase Storage with on-the-fly resizing.

### Phase 4 — Engagement & Scale
- WhatsApp Cloud API: replace SMS OTP, send order-status updates, abandoned-cart nudges, reorder reminders (using the staged `notifications` table).
- Loyalty: points per delivered order, tier benefits, referral codes.
- Promotions engine: discount codes, bundle pricing, time-boxed offers (server-evaluated, never client-trusted).
- Search upgrade: typo-tolerant, brand/category facets, synonym dictionary in Arabic.
- Reviews & ratings (moderated; gated to delivered orders only).
- Marketing analytics: UTM capture, channel attribution, cohort retention dashboards.

### Sudan-Wide Expansion
- **Data-first rollout:** add state → cities → neighbourhoods rows with verified delivery fees. No code change required.
- **Operational gates per new region:**
  1. At least one CS staff member assigned to that region's orders.
  2. A trusted external courier list seeded in `user_roles`.
  3. A cutoff and delivery-window agreed with local couriers.
- **Pricing & taxes:** in v1 a single SDG price applies nationally. Regional pricing requires a new `regional_prices` table — defer until justified by data.
- **Logistics partners:** when in-house delivery doesn't scale to a region, add a `delivery_provider` enum on `delivery_assignments` and integrate a third-party (e.g. courier API). The lifecycle and QR confirmation remain unchanged.
- **Multi-warehouse:** future `warehouses` + `inventory_by_warehouse` model; current `inventory` becomes a sum/view. Triggered when a second physical stocking location opens.
- **Compliance:** as the platform crosses state lines, add per-region compliance fields (e.g. product authenticity certificates per brand) — already structurally possible via `brands` extensions.

---

*End of Blueprint v1.0.*
