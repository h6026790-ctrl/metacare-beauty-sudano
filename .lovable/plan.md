# Metacare Beauty — Production Readiness Pass

Answers to your four questions first, then the ordered work.

## 1. Safe to fix now (low risk)

- Admin seed password (1) — rotate the dev admin password to a strong generated one; keep the account so you don't lose access. Old migrations are history and cannot be edited, so the fix is rotation, not deletion.
- Staff order claiming (3) — a `claim_order` database function that only claims unassigned orders.
- Reset-flow phone enumeration (5) — generic response.
- User lookup by phone (6) — read from `profiles.phone` instead of scanning accounts.
- "On Sale" toggle (7) — remove the manual switch; sale is derived from compare-at price.
- Product flags preserved on edit (8).
- Sitemap from live catalogue with slugs and the real domain (9).
- Cart notes carried into the order (10).
- Contact details centralised on 0993373874 (11).
- Order status state machine server-side (16).
- Product SEO metadata + JSON-LD (17).
- Dead code removal after import checks (19).
- Build/lint/flow verification (20).

## 2. Riskier — done carefully, behind explicit checks

- Rate limiting (4): the platform has no built-in rate-limit primitive, so this will be an ad-hoc counter table keyed by phone. OTP attempt limits already exist (5 tries). Adding request throttling can lock out a legitimate customer who retries, so limits will be generous (e.g. 3 requests / 15 min per phone).
- Image upload (12): needs a new storage bucket and policies. No existing image URLs break.
- Notifications (14): switching to real in-app notification rows changes what the notifications page reads.
- Tests/CI (15): safe but the largest time cost; scoped to a few smoke tests.
- Removing `.env` (2): the file is platform-managed here and is how the app gets its backend URL/key locally. Those are publishable values, not secrets. I will add `.env.example` and documentation, but I will not delete `.env` — deleting it breaks the running app.

## 3. Needs your input or settings

- Real business phone/WhatsApp: received (0993373874). Email and address will stay as currently configured unless you give new ones.
- Production domain for sitemap/canonical/OG: will use the published project domain unless you attach a custom domain.
- New admin password: I will generate a strong one and show it to you once.
- No third-party credentials needed — payments and delivery stay manual, notifications stay in-app.

## 4. Confirmed scope decisions

- Prices stay hidden from guests (18) — no change, intentional.
- Coupons (13) — out of scope for launch; will be marked explicitly in the docs.
- Notifications (14) — in-app only.

## Implementation order

**Step A — Security & access**
Rotate admin password; add `claim_order` function and switch staff claiming to it; generic reset responses; rate-limit table for registration/reset requests.

**Step B — Order integrity**
Server-side status transition rules: `new → review → paid → shipping → delivered`; `new/review → cancelled`; `paid/shipping → returned`. Anything else rejected with a clear Arabic/English message. Existing paid-reference requirement kept.

**Step C — Catalogue & admin fixes**
Remove the on-sale toggle, preserve promo flags on edit, add image upload to storage with type/size validation (jpg/png/webp, max 5 MB) alongside the existing URL field.

**Step D — Customer flow**
Cart notes flow into the order's notes field at checkout.

**Step E — Content, SEO, cleanup**
Central contact config with the real number; live sitemap with slugs and production domain; product page metadata and JSON-LD; in-app notification rows written on order status change; remove confirmed-unused mock/example/legacy files; add `.env.example`; mark coupons out of scope in docs.

**Step F — Verification**
Build, lint, and browser-driven passes: guest browsing with prices hidden, customer checkout, staff claim + status flow, admin catalogue/inventory edit, plus a backend security scan.

## Technical notes

- `claim_order`: SECURITY DEFINER, `search_path = public`, verifies staff/admin via `is_staff_or_admin`, updates only where `assigned_staff_id IS NULL`, writes an audit row.
- Rate limiting: `auth_rate_limits(key, window_start, count)` checked inside the registration/reset server functions; no schema change to `registration_requests`.
- Status machine enforced inside `updateOrderStatus` before the write, so existing inventory-restore triggers keep working unchanged.
- Phone lookup uses `profiles.phone` (already normalised at write time); the paging fallback stays as a safety net for accounts with no profile row.
- Arabic-first RTL, price gating, and the manual-payment workflow are untouched throughout.
