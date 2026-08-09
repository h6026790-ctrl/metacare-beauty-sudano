# Fix: wishlist shows every product as unavailable

## Root cause (confirmed)

It is not a shape change in the join — it is a permissions change.

The hardening pass that hid exact stock quantities from customers left the `inventory` table readable **only by staff and admin**:

- `p_inventory_read_staff` — SELECT, condition `is_staff_or_admin(auth.uid())`
- `p_inventory_admin` — ALL, admin only

`getMyWishlist` runs with the signed-in customer's own database client, so its `products(..., inventory(stock))` join silently returns an empty relation for every product. `stockOf()` then reads `0` and marks every wishlist item out of stock with its "add to cart" button disabled. Admin pages still show correct stock because admins pass the policy.

The customer-safe signal already exists: `products.is_available`, a boolean kept in sync with stock by the `sync_product_availability` trigger on `inventory`. The catalogue feeds already use this style of flag (`in_stock`), which is why product listing and product detail pages are unaffected.

## Same-shape checks

- `src/routes/cart.tsx` — does not read stock at all; not affected visually. But `getMyCart` selects the same unreadable `inventory(stock)`, so it carries dead data.
- Product listing / detail — use `catalog_public` / `catalog_authenticated` feeds with `in_stock`; correct.
- No other customer-side `inventory(stock)` reads exist.

## Fix

1. `src/lib/api/commerce.functions.ts`
   - `getMyWishlist`: select `is_active, is_available` on the product instead of `inventory(stock)`.
   - `getMyCart`: same swap, so the cart's product payload carries a usable availability flag rather than a blocked join.
2. `src/routes/account.wishlist.tsx`
   - Replace `stockOf()` with an availability read: out of stock when `is_available === false` or `is_active === false`, tolerating the old shape so nothing breaks mid-deploy.
   - Keep the existing badge and disabled-button behaviour, Arabic-first/RTL markup untouched.

No database, RLS, or checkout changes. Exact quantities stay hidden from customers; placing an order still validates real stock atomically in `place_order`.
