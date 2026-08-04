# Metacare Beauty — Row Level Security Summary

All policies use `public.has_role()` / `public.is_staff_or_admin()`
(SECURITY DEFINER) to keep checks non-recursive. The `agent` role has been
removed from `app_role` — only `admin`, `staff`, and `customer` exist.

## Public catalog & geography

`states · cities · neighborhoods · brands · categories · product_images`

| Action | Anon | Customer | Staff | Admin |
|---|---|---|---|---|
| SELECT (active rows) | ✓ | ✓ | ✓ | ✓ |
| SELECT inactive | — | — | — | ✓ |
| INSERT / UPDATE / DELETE | — | — | — | ✓ |

Read policies are split into dedicated `TO anon` (plain predicate, no function
call) and `TO authenticated` (role-aware) variants, so `anon` no longer needs
`EXECUTE` on `has_role` / `is_staff_or_admin`. Those grants are revoked.

## Products, pricing, inventory (hardened)

- `products` — `anon` has **column-level** SELECT only (no `price_sdg`,
  no `compare_at_sdg`); `authenticated` reads active rows, staff/admin read all.
- `inventory` — SELECT restricted to staff/admin; `anon` has no grant at all.
  Quantities are never exposed to visitors or customers.
- `products.is_available` (boolean, maintained by trigger
  `trg_sync_product_availability`) and generated `products.is_on_sale` carry the
  only stock/discount signals the storefront needs.
- Catalogue feeds (`security_invoker = on` views):
  - `catalog_public` → `anon` + `authenticated`: no prices, no quantities.
  - `catalog_authenticated` → `authenticated` only: prices included.


## Identity

| Table | Self | Staff | Admin |
|---|---|---|---|
| `profiles` | R/W own row | SELECT all | ALL |
| `user_roles` | SELECT own | — | ALL |
| `addresses` | R/W own | SELECT | ALL |

## Cart & wishlist

| Table | Owner | Anyone else |
|---|---|---|
| `carts` | ALL on own | — |
| `cart_items` | ALL when row's cart belongs to caller | — |
| `wishlists` | ALL on own | — |

## Orders

| Action | Customer | Staff | Admin |
|---|---|---|---|
| SELECT own | ✓ | — | ✓ |
| SELECT any | — | ✓ (assigned) | ✓ |
| INSERT (`profile_id = auth.uid()`) | ✓ | — | ✓ |
| UPDATE status | — | ✓ (assigned) | ✓ |

`order_items` and `order_status_history` inherit visibility from their parent
order (customer / staff / admin).

## Delivery assignments

| Action | Customer | Staff | Admin |
|---|---|---|---|
| SELECT | own order (for QR) | ✓ | ✓ |
| INSERT | — | ✓ | ✓ |
| UPDATE (mark completed via QR RPC) | own order (via `confirm_delivery_by_qr`) | ✓ | ✓ |

`delivery_assignments.agent_id` is nullable and no longer FK-linked to a user;
staff create these rows manually to generate the QR token. Couriers are
external and never referenced by user id.

## Audit logs

| Action | Customer | Staff | Admin |
|---|---|---|---|
| SELECT | — | ✓ | ✓ |
| INSERT | — written by triggers only (service_role) — |

## Notifications

| Action | Customer | Staff | Admin |
|---|---|---|---|
| SELECT | own | ✓ | ✓ |

## Hardening checklist applied

- No policy references the `agent` role or `agent_id = auth.uid()`.
- Trigger functions revoked from `PUBLIC`, `anon`, `authenticated`.
- `has_role` / `is_staff_or_admin` revoked from `anon`, granted to `authenticated`.
- All `SECURITY DEFINER` functions pinned to `SET search_path = public`.
- No policy references the same table it protects (recursion-safe).
