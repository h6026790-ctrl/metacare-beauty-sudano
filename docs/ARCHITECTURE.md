# Metacare Beauty — Page Architecture & System Map

> Phase 1 deliverable. Review and approve before Phase 2 (backend).
> Currently serves Wad Madani only; architecture is designed to scale to all
> Sudan states without restructuring.

## 1. Brand & language

- **Primary language**: Arabic (default), RTL layout
- **Secondary language**: English (toggle in header + account)
- **Brand mark**: official `metacare` logo (uploaded asset)
- **Palette**: deep medical blue → cyan → soft white, subtle violet accents
- **Typography**: Tajawal (Arabic), Instrument Serif (display), Inter (body)
- **Currency / locale**: SDG, Arabic and English numerals, Sudan locale

## 2. Public sitemap (customer-facing)

```
/                          Home (hero, featured, recommended, new arrivals,
                           brands, categories, best-sellers, trust strip)
/products                  Shop (filter by category, brand)
/products/:id              Product detail (price hidden until login)
/categories                Category landing
/brands                    Brand index
/brands/:id                Brand detail (products by brand)
/offers                    On-sale collection
/search?q=                 Search results

/cart                      Cart (price hidden until login)
/checkout                  Checkout (login-gated, Wad Madani only)
/orders/:id?confirmed=     Order confirmation + tracking + WhatsApp deep-link

/auth                      Mobile + OTP (sign-in / register tabs)

/account                   Profile, orders, wishlist tabs
/account/wishlist          Wishlist grid (deep-linkable)
```

## 3. Operational sitemap (staff-only)

```
/admin                     Admin Dashboard — tabs: Overview, Orders, Products,
                           Catalog (cat+brand), Customers, Team
                           (CS + agents), Content (banners), Reports
/staff                     Customer Service — assigned-orders queue with
                           filters, master/detail view, WhatsApp, confirm
                           payment, assign agent, notes
/delivery                  Delivery Console — today's jobs, per-order QR
                           confirmation, call/WhatsApp/map shortcuts,
                           completed-today log
```

Auth gating for these surfaces is delivered in Phase 2 via Supabase RLS +
`has_role()` SECURITY DEFINER on a dedicated `user_roles` table.

## 4. SEO

- `public/robots.txt` allows public crawls, disallows /admin, /staff,
  /delivery, /account, /checkout, /cart, /auth
- `src/routes/sitemap[.]xml.ts` server route emits a fresh XML sitemap
  covering home, shop, categories, brands, offers, every brand page and
  every product page. BASE_URL placeholder until the production domain is
  set.
- Per-route `head()` titles and descriptions; meta lang/dir applied to
  `<html>` from the i18n provider.

## 5. Order lifecycle

`new → review → paid → shipping → delivered`
plus terminal branches `cancelled`, `returned`.

- **Cutoff**: orders placed after the configurable daily cutoff carry to the
  next day's queue (Phase 3 admin setting).
- **Morning reset**: a 06:00 job (Phase 3) re-fans assignments to the active
  CS/agent rotation.
- **Auto-archive**: orders in a terminal state for 3+ days move to
  `archived_orders` and out of the operational tables.

## 6. Cart, wishlist, auth (Phase 1 state)

- Zustand persisted store: `cart`, `wishlist`, `orders`, `user` (in
  `localStorage` under `metacare-store`).
- Mock OTP accepts any code (Phase 1) — replaced by Twilio Verify in
  Phase 2.
- All prices and totals are hidden behind a login prompt
  (`<PricePill />`).

## 7. Phase 2 database schema (planned)

Tables (RLS-enabled, separate `user_roles` table for role checks):

```
profiles                id (auth.users), name, phone, whatsapp, default_address_id
addresses               id, profile_id, city, state, neighborhood, street, notes
brands                  id, name_ar, name_en, tagline_ar, tagline_en, logo_url
categories              id, name_ar, name_en, icon, sort_order
products                id, brand_id, category_id, name_*, description_*,
                        price_sdg, compare_at_sdg, is_featured, is_new,
                        is_best_seller, created_at
product_images          id, product_id, url, sort_order
inventory               product_id (pk), stock, updated_at
carts                   id, profile_id (unique), updated_at
cart_items              cart_id, product_id, qty
wishlists               profile_id, product_id (composite pk)
orders                  id, number (MCyymmdd-####), profile_id, status,
                        subtotal_sdg, delivery_sdg, total_sdg, address_*,
                        placed_at, cutoff_bucket
order_items             order_id, product_id, qty, price_sdg
order_status_history    order_id, status, at, actor_id
notifications           id, profile_id, channel (wa/sms), template, sent_at
user_roles              user_id, role (admin|staff|agent|customer)
delivery_assignments    order_id, agent_id, assigned_at, completed_at
archived_orders         (same shape as orders, populated by daily job)
```

All public-schema tables receive explicit `GRANT` statements (per project
rule). `has_role(uid, role)` SECURITY DEFINER drives RLS policies.

## 8. Multi-state expansion path

- `addresses.state` already in the schema (default `"Gezira"`, Wad Madani as
  the only allowed city in Phase 2).
- `delivery_zones` table (Phase 3) keys per-zone delivery fee, cutoff and
  active agents.
- Checkout city/neighborhood dropdowns pull from `delivery_zones`; rolling
  out a new state requires only DB rows, no app changes.

## 9. Phase 2 dependencies (need from operator)

- Twilio Account SID / Auth Token / Verify Service SID (mobile OTP)
- Bank transfer account details (shown on checkout + order page)
- (Phase 4) Meta WhatsApp Business token + phone number
- Optional: real product photography to replace prototype imagery

## 10. Out-of-scope for Phase 1

- Real OTP, real cart persistence to DB, real order lifecycle
- Role-based gating on /admin /staff /delivery
- WhatsApp template messages (only `wa.me` deep-links for now)
- Analytics dashboards beyond mocked numbers
