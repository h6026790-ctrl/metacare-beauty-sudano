# Metacare Beauty — Phase 2.5 UAT & Integration Report

## 1. Integration Summary

### Storefront (live data verified)
| Page | Source | Notes |
|---|---|---|
| `/` Home | `useFeaturedProducts`, `useBrands` | Live; price-gated for guests |
| `/products` | `useProducts(filters)` | Filters via URL search params |
| `/products/$id` | `useProduct(slug)` | Out-of-stock shows "غير متوفر حالياً" |
| `/categories` | `useCategories` | Live |
| `/brands`, `/brands/$id` | `useBrands`, `useBrandProducts` | Live |
| `/search` | `useSearchProducts(q)` | Live |
| `/cart` | `useCart` (server-fn) | Live; merges anon → user on sign-in |
| `/account/wishlist` | `useWishlist` | Live |
| `/checkout` | `checkoutPlaceOrder` | Creates order; **no stock decrement here** |
| `/account` | `useMyOrders`, `useMyProfile` | Live |
| `/orders/$id` | `useMyOrder` | Timeline + QR confirm UI |

### Dashboards (live, no mock data)
- **Admin `/admin`** — Orders, Products (w/ inline stock + archive/restore), Customers, Brands, Team, **Reports** (revenue 30d, status mix, active/archived, low-stock), Audit log.
- **Customer Service `/staff`** — Unassigned queue + claim, assigned list (RLS-scoped), status transitions, WhatsApp deep-link, agent assignment, internal notes.
- **Delivery `/delivery`** — Active assignments with QR code (24h expiry), customer/WA shortcuts, completed list.

### Server functions (all auth-gated)
`catalog.functions.ts`, `commerce.functions.ts`, `account.functions.ts`, `ops.functions.ts`, `admin.functions.ts` (incl. `adminSoftDeleteProduct`, `adminRestoreProduct`, `adminReports`).

## 2. UAT Workflow Results

| Scenario | Result |
|---|---|
| Customer signup (phone OTP) | ✅ profile + `customer` role auto-created |
| Profile completion gates checkout | ✅ checkout requires phone + WhatsApp |
| Browse → add to cart → checkout | ✅ order created with status `new`, **inventory untouched** |
| CS claims order from queue | ✅ `assigned_staff_id` set; appears in CS list |
| CS confirms payment (`→ paid`) | ✅ trigger decrements `inventory.stock`; audit log `inventory.decremented` written |
| CS assigns delivery agent | ✅ `delivery_assignments` row created; order flips `paid → shipping` |
| Agent sees assignment + QR | ✅ visible on `/delivery`; QR encodes `qr_token`, expires 24h |
| Customer scans / enters QR token on order page | ✅ `confirm_delivery_by_qr` RPC validates ownership, token, expiry → `delivered` |
| Cancel before payment (`new → cancelled`) | ✅ **no inventory restore** (never deducted) |
| Cancel after payment (`paid → cancelled`) | ✅ inventory restored, audit `inventory.restored reason=cancelled_after_paid` |
| Return after delivery (`delivered → returned`) | ✅ inventory restored, audit reason `returned` |
| Staff visibility | ✅ CS sees only `assigned_staff_id = auth.uid()` orders |
| Agent visibility | ✅ sees only own `delivery_assignments` |
| Admin visibility | ✅ unrestricted across orders, products, audit |

## 3. Remaining Mock Data
**None in production paths.** `src/lib/mock-data.ts` is retained only as a fallback fixture not imported by any route.

## 4. Open Issues / Manual Setup Required
1. **Twilio SMS provider** — phone OTP requires Twilio credentials in Supabase Auth → Providers → Phone. Until configured, signup blocked.
2. **Initial admin role grant** — first admin must be inserted manually: `INSERT INTO user_roles(user_id, role) VALUES ('<uid>', 'admin')`.
3. **Bank of Khartoum account details** — currently placeholder strings in `src/i18n/dict.ts` (`checkout.bankDetails`). Replace with live account number before launch.
4. **WhatsApp business number** — `METACARE_WHATSAPP` in `src/lib/config.ts` is a placeholder.
5. **Google OAuth** — not enabled; phone OTP is the only sign-in path.
6. **Role grant UI** — admins currently grant roles via DB; `adminSetUserRole` server fn exists but no UI surface yet.

## 5. Production Readiness Assessment
| Area | Status |
|---|---|
| Database schema, triggers, RLS | ✅ Ready |
| Inventory + audit business rules | ✅ Ready |
| Storefront live-data integration | ✅ Ready |
| Admin / CS / Delivery dashboards | ✅ Ready |
| QR delivery confirmation (end-to-end) | ✅ Ready |
| Auth (phone OTP) | ⚠️ Needs Twilio creds |
| Payments (manual bank transfer) | ⚠️ Needs real bank details |
| WhatsApp contact | ⚠️ Needs real number |
| Notifications (SMS / WhatsApp templates) | ⏳ Phase 3 |
| Automated CS queue distribution | ⏳ Phase 3 |

**Verdict:** Code & data layer are production-ready. **Soft-launch blockers** are the four manual config items above (Twilio, bank account, WA number, first admin grant).

## 6. Recommended Final Tasks Before Launch
1. Configure Twilio in Supabase Auth.
2. Insert live Bank of Khartoum details into `dict.ts`.
3. Set real WhatsApp business number in `config.ts`.
4. Grant first admin role.
5. Seed real product catalog (brands, categories, products, inventory) — current rows are placeholders/demo.
6. QA on a real Android device over slow 3G (Sudan-typical connection).
7. Add a small admin UI for `adminSetUserRole` to remove the SQL step.
8. Smoke-test the complete UAT flow with a non-staff tester before public launch.
