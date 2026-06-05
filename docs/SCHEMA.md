# Metacare Beauty — Database Schema (Phase 2)

All tables live in `public`. Row Level Security is enabled on every table.
Explicit GRANTs are issued in each migration (no reliance on default privileges).

## Enums

- `app_role` — `admin | staff | agent | customer`
- `order_status` — `new | review | paid | shipping | delivered | cancelled | returned`

## Geography (multi-state ready)

| Table | Columns | Notes |
|---|---|---|
| `states` | id, name_ar, name_en, is_active, sort_order | Seed: Gezira |
| `cities` | id, state_id→states, name_ar/en, is_active, sort_order | Seed: Wad Madani |
| `neighborhoods` | id, city_id→cities, name_ar/en, **delivery_fee_sdg**, is_active, sort_order | Per-zone delivery fee |

## Catalog

| Table | Columns | Notes |
|---|---|---|
| `brands` | id, slug, name_ar/en, tagline_ar/en, logo_url, is_active, sort_order, created_at | Public read |
| `categories` | id, slug, name_ar/en, icon, is_active, sort_order | Public read |
| `products` | id, brand_id, category_id, slug, name_ar/en, description_ar/en, **price_sdg**, compare_at_sdg, image_url, is_featured, is_new, is_best_seller, is_active, created_at, updated_at | |
| `product_images` | id, product_id, url, sort_order | |
| `inventory` | product_id PK, stock, updated_at | One row per product |

## Identity

| Table | Columns | Notes |
|---|---|---|
| `profiles` | id (= auth.users.id), full_name, phone, whatsapp | Auto-created on signup |
| `user_roles` | id, user_id, role, unique(user_id, role) | **Roles are NEVER on profiles** |
| `addresses` | id, profile_id, state_id, city_id, neighborhood_id, street, notes, is_default | |

## Commerce

| Table | Columns | Notes |
|---|---|---|
| `carts` | id, profile_id (unique) | One cart per customer |
| `cart_items` | (cart_id, product_id) PK, qty | |
| `wishlists` | (profile_id, product_id) PK | |
| `orders` | id, **number** (auto `MCyymmdd-####`), profile_id, status, subtotal_sdg, delivery_sdg, total_sdg, contact_*, address_* snapshot, cutoff_bucket, placed_at, archived_at | |
| `order_items` | id, order_id, product_id, **name_snapshot**, qty, price_sdg | Prices snapshotted at order time |
| `order_status_history` | id, order_id, status, actor_id, note, at | Auto-written on every status change |
| `delivery_assignments` | id, order_id (unique), agent_id, **qr_token** (auto), assigned_at, assigned_by, completed_at | **Created manually by staff — never automatic** |
| `notifications` | id, profile_id, channel, template, payload, sent_at | Staged for Phase 4 |

## Audit

| Table | Columns | Notes |
|---|---|---|
| `audit_logs` | id, actor_id, action, entity_type, entity_id, metadata jsonb, at | Tracks order status changes, inventory edits, product edits, delivery assignments, admin role grants |

## Triggers

| Trigger | Fires on | Effect |
|---|---|---|
| `handle_new_user` | `auth.users INSERT` | Creates profile + grants `customer` role |
| `set_order_number` | `orders BEFORE INSERT` | Generates `MCyymmdd-####` |
| `handle_order_status_change` | `orders INSERT/UPDATE` | Logs status history; **decrements inventory only when status enters `paid`**; writes audit log |
| `audit_product_change` | `products INSERT/UPDATE/DELETE` | audit_logs entry |
| `audit_inventory_change` | `inventory UPDATE` | audit_logs entry |
| `audit_delivery_assignment` | `delivery_assignments INSERT/UPDATE` | audit_logs entry |
| `touch_updated_at` | `profiles/products BEFORE UPDATE` | Maintains `updated_at` |

## Security definer helpers

- `has_role(uid, role)` — drives all role policies (avoids RLS recursion on `user_roles`)
- `is_staff_or_admin(uid)` — convenience wrapper used in order/audit policies

Both are `SECURITY DEFINER STABLE` with `search_path = public`, EXECUTE
restricted to `authenticated`.

## Adjustments per Phase 2 plan

1. **Inventory decrement is gated on `status → 'paid'`.** Checkout does NOT touch stock.
2. **Delivery assignments are NOT auto-created.** Staff must call `assignDeliveryAgent` after confirming payment.
3. **`audit_logs` covers** order status changes, inventory edits, product edits, delivery assignments, and admin role grants.

## Multi-state expansion

Adding a new Sudan state (e.g. Khartoum) is a pure data change:

```sql
INSERT INTO states (name_ar, name_en) VALUES ('الخرطوم','Khartoum');
INSERT INTO cities (state_id, name_ar, name_en) VALUES (..., 'الخرطوم','Khartoum');
INSERT INTO neighborhoods (city_id, name_ar, name_en, delivery_fee_sdg) VALUES ...;
```

No application code change required — checkout dropdowns read from the tables.
