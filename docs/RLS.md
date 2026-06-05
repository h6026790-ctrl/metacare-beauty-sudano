# Metacare Beauty — Row Level Security Summary

All policies use `public.has_role()` / `public.is_staff_or_admin()`
(SECURITY DEFINER) to keep checks non-recursive.

## Public catalog & geography

`states · cities · neighborhoods · brands · categories · products · product_images · inventory`

| Action | Anon | Customer | Staff | Agent | Admin |
|---|---|---|---|---|---|
| SELECT (active rows) | ✓ | ✓ | ✓ | ✓ | ✓ |
| SELECT inactive | — | — | products only | — | ✓ |
| INSERT / UPDATE / DELETE | — | — | — | — | ✓ |

> Anon can browse the catalog, but `price_sdg` is hidden in the UI behind the login prompt (`<PricePill />`). RLS allows reading the price column — the gating is intentionally a UX rule so SEO/snippet bots still see structured product data.

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

| Action | Customer | Staff | Agent (assigned) | Admin |
|---|---|---|---|---|
| SELECT own | ✓ | — | — | ✓ |
| SELECT any | — | ✓ | own assignments only | ✓ |
| INSERT (`profile_id = auth.uid()`) | ✓ | — | — | ✓ |
| UPDATE status | — | ✓ | own assignments only | ✓ |

`order_items` and `order_status_history` inherit visibility from their parent
order (customer / staff / assigned agent / admin).

## Delivery assignments

| Action | Customer | Staff | Agent | Admin |
|---|---|---|---|---|
| SELECT | own order | ✓ | own | ✓ |
| INSERT | — | ✓ | — | ✓ |
| UPDATE (mark completed) | — | ✓ | own | ✓ |

## Audit logs

| Action | Customer | Staff | Agent | Admin |
|---|---|---|---|---|
| SELECT | — | ✓ | — | ✓ |
| INSERT | — written by triggers only (service_role) — |

## Notifications

| Action | Customer | Staff | Admin |
|---|---|---|---|
| SELECT | own | ✓ | ✓ |

## Hardening checklist applied

- Trigger functions revoked from `PUBLIC`, `anon`, `authenticated` — only triggers (running as table owner) can call them.
- `has_role` / `is_staff_or_admin` revoked from `anon`, granted to `authenticated`.
- All `SECURITY DEFINER` functions pinned to `SET search_path = public`.
- No policy references the same table it protects (recursion-safe).
