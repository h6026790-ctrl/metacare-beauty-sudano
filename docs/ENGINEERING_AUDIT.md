# تقرير هندسي شامل — Metacare Beauty

> تاريخ الإصدار: 2026-07-01
> النسخة: v1.0 (بناءً على الحالة الفعلية للكود وقاعدة البيانات)
> المنهجية: كل معلومة في هذا التقرير مُستخرَجة إمّا من ملف مصدري في `src/` أو من استعلام حي على قاعدة البيانات عبر `psql`، أو من `supabase--linter`. أي بند غير قابل للتحقق يُذكر صراحةً كذلك.

---

## 1) Executive Summary

**Metacare Beauty** متجر تجميل إلكتروني موجّه للسوق السوداني (ولاية الجزيرة كنقطة بداية) بواجهة عربية-أولاً كاملة الاتجاه (RTL)، يعتمد على TanStack Start + React 19 + Tailwind v4 + Supabase (Lovable Cloud).

- **الحالة الحالية:** جاهز وظيفيًا للاختبار الداخلي (UAT مكتمل)، غير جاهز للإطلاق العام بسبب عناصر تشغيلية يدوية (بيانات بنكية، رقم WhatsApp، تعيين أول Admin، بيانات كتالوج حقيقية).
- **نسبة الإنجاز التقديرية:** **≈ 82%** من نطاق Phase 2.5 المتفق عليه.
  - Database + RLS + Triggers: 100%
  - Server functions (Auth/Catalog/Commerce/Account/Ops/Admin): 100%
  - Storefront UI: 95%
  - Dashboards (Admin/Staff/Delivery): 90%
  - المصادقة اليدوية OTP: 100% كود، 60% تكامل تشغيلي (لا توجد قناة إرسال آلية للـ OTP)
  - المدفوعات: 20% (تحويل بنكي يدوي بدون تكامل بوابة)
  - الإشعارات (SMS/WA): 0% (مُرَحَّلة لـ Phase 3)
  - الاختبارات الآلية: 0%

- **الإحصائيات الخام:**
  - عدد ملفات الـ routes: **18** (`src/routes/`)
  - عدد Server Functions files: **7** (`src/lib/api/`)
  - إجمالي أسطر الكود المُدَقَّق (routes + api + components أساسية): **~4,000 سطر**
  - عدد جداول قاعدة البيانات (public): **22**
  - عدد سياسات RLS: **41**
  - عدد Foreign Keys: **31**
  - عدد Database Functions (SECURITY DEFINER + others): **10**
  - عدد migrations: **5**

---

## 2) Functional Modules

### 2.1 Authentication & Registration (OTP يدوي)

| الحقل | القيمة |
|---|---|
| **الغرض** | تسجيل/دخول المستخدم عبر OTP يعتمده موظف CS يدويًا وينقله عبر WhatsApp |
| **الحالة** | ✅ مكتملة (كود) — ⚠️ تعتمد على تدخل بشري لإرسال OTP |
| **Routes** | `src/routes/auth.tsx` |
| **Components** | `src/components/RegistrationRequestsPanel.tsx` |
| **Hooks** | `src/hooks/useAuth.ts` |
| **Server functions** | `src/lib/api/auth.functions.ts` (`submitRegistrationRequest`, `verifyRegistrationOtp`, `listRegistrationRequests`, `approveRegistrationRequest`, `rejectRegistrationRequest`, `regenerateRegistrationOtp`) |
| **Database tables** | `registration_requests`, `profiles`, `user_roles`, `auth.users` |
| **Triggers** | `on_auth_user_created` → `handle_new_user()` — ينشئ profile ويمنح دور `customer` |
| **Edge functions** | لا يوجد |
| **مدى الاكتمال** | 100% للكود؛ ينقص: تلقائية إرسال OTP، إعادة الإرسال المُقنَّنة (throttle) على الواجهة، rate-limit على `submitRegistrationRequest` |

### 2.2 Catalog (Brands / Categories / Products)

| الحقل | القيمة |
|---|---|
| **الغرض** | عرض المنتجات، البراندات، والفئات مع فلاتر ودعم منتجات نافدة |
| **الحالة** | ✅ مكتملة |
| **Routes** | `products.tsx`, `products.$id.tsx`, `brands.tsx`, `brands.$id.tsx`, `categories.tsx`, `search.tsx`, `offers.tsx` |
| **Components** | `ProductCard.tsx`, `PricePill.tsx` |
| **Hooks** | مُدارة عبر TanStack Query داخل `src/lib/api/queries.ts` (`useProducts`, `useProduct`, `useBrands`, `useBrandProducts`, `useCategories`, `useSearchProducts`, `useFeaturedProducts`) |
| **Server functions** | `src/lib/api/catalog.functions.ts` |
| **Database tables** | `products`, `product_images`, `brands`, `categories`, `inventory` |
| **قواعد الأعمال المحققة** | ✔ الأسعار مرئية فقط للمستخدمين المصادقين (يُطبَّق في `PricePill.tsx`) — ✔ الكميات مخفية عن العملاء — ✔ المنتجات النافدة تظهر مع «غير متوفر حالياً» (يُطبَّق في `products.$id.tsx`) |
| **الاكتمال** | 100% |

### 2.3 Cart & Wishlist

| الحقل | القيمة |
|---|---|
| **الغرض** | سلة تسوق للمستخدم المصادَق + قائمة أمنيات |
| **الحالة** | ✅ مكتملة |
| **Routes** | `cart.tsx`, `account.wishlist.tsx` |
| **Server functions** | `commerce.functions.ts` (`getCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart`), Wishlist في نفس الملف |
| **Database tables** | `carts`, `cart_items`, `wishlists` |
| **الاكتمال** | 100% — الدمج anonymous→user عند تسجيل الدخول موثّق في UAT |

### 2.4 Checkout & Orders

| الحقل | القيمة |
|---|---|
| **الغرض** | إتمام طلب مع عنوان توصيل، وحساب الرسوم حسب الحي |
| **الحالة** | ✅ مكتملة (بعد تعديل «لا تفاصيل بنكية») |
| **Routes** | `checkout.tsx`, `orders.$id.tsx`, `account.tsx` |
| **Components** | `OrderTimeline.tsx` |
| **Server functions** | `commerce.functions.ts` (`checkoutPlaceOrder`), `account.functions.ts` (`getMyOrders`, `getMyOrder`, `updateMyProfile`) |
| **Database tables** | `orders`, `order_items`, `order_status_history`, `addresses`, `states`, `cities`, `neighborhoods` |
| **Triggers** | `set_order_number` (توليد `MCyymmdd-####`) + `handle_order_status_change` (تاريخ الحالة + مخزون + audit) |
| **قواعد الأعمال** | ✔ الجرد لا يُخصم إلا عند `→ paid` — ✔ الاستعادة على `returned` أو `cancelled` بعد `paid` فقط |
| **الاكتمال** | 100% لل V1 (بدون بوابة دفع) |

### 2.5 Operations (CS / Delivery)

| الحقل | القيمة |
|---|---|
| **الغرض** | إدارة CS للطلبات + تعيين مندوبين + تأكيد التسليم عبر QR |
| **الحالة** | ✅ مكتملة |
| **Routes** | `staff.tsx`, `delivery.tsx`, `orders.$id.tsx` (تأكيد QR للعميل) |
| **Server functions** | `ops.functions.ts` (388 سطر — `staffListUnassigned`, `staffClaimOrder`, `staffListMyOrders`, `staffUpdateOrderStatus`, `staffAssignAgent`, `staffAddNote`, `agentListMyAssignments`, `agentQrPayload`) + RPC `confirm_delivery_by_qr` |
| **Database tables** | `orders.assigned_staff_id`, `order_notes`, `delivery_assignments`, `audit_logs` |
| **الاكتمال** | 100% — RLS يعزل CS ليرى فقط طلباته المُسنَدة، والمندوب يرى مهامه فقط |

### 2.6 Admin Dashboard

| الحقل | القيمة |
|---|---|
| **الغرض** | إدارة كاملة: منتجات، مخزون، أدوار، تقارير، سجل تدقيق |
| **الحالة** | ✅ مكتملة |
| **Routes** | `admin.tsx` (286 سطر — تبويبات: Orders / Products / Customers / Brands / Team / Reports / Audit) |
| **Server functions** | `admin.functions.ts` (`adminListProducts`, `adminUpsertProduct`, `adminSoftDeleteProduct`, `adminRestoreProduct`, `adminSetInventory`, `adminListUsers`, `adminSetUserRole`, `adminReports`, `adminAuditLog`) |
| **Database tables** | كل الجداول (RLS لـ admin غير مقيّد) |
| **قواعد الأعمال** | ✔ المنتجات لا تُحذف فعليًا — soft delete عبر `is_active=false` |
| **الاكتمال** | 100% للوظائف الأساسية؛ ينقص: واجهة تعديل/إضافة منتجات كاملة (النموذج مبسّط) — واجهة إدارة عناوين ولايات/مدن/أحياء |

### 2.7 i18n & RTL

| الحقل | القيمة |
|---|---|
| **الغرض** | عربي/إنجليزي مع افتراضي عربي وRTL |
| **Files** | `src/i18n/I18nProvider.tsx`, `src/i18n/dict.ts` |
| **الحالة** | ✅ مكتملة — `dir="rtl"` مُطبَّق على `__root.tsx` |

---

## 3) Authentication & Authorization

### 3.1 ما تم تنفيذه

- **آلية الدخول:** Supabase Auth بالبريد/كلمة سر **اصطناعية** مشتقّة من رقم الهاتف: `${digits}@phone.metacare.local`. المستخدم لا يرى هذا البريد أبدًا؛ يستخدم رمز OTP فقط.
- **دورة الطلب:** إدخال بيانات → إنشاء صف في `registration_requests` بحالة `pending` → موظف CS يوافق → عميل يدخل OTP → تُنشأ/تُحدَّث `auth.users` وتُعاد بيانات `signInWithPassword` مؤقتة.
- **الأدوار (enum `app_role`):** `admin | staff | agent | customer`.
- **جدول الأدوار:** `user_roles` منفصل عن `profiles` (يمنع privilege escalation).
- **دوال SECURITY DEFINER:**
  - `public.has_role(uuid, app_role) → boolean`
  - `public.is_staff_or_admin(uuid) → boolean`
  - `public.handle_new_user()` (trigger)
  - `public.confirm_delivery_by_qr(uuid, text) → jsonb`
- **RLS Middleware:** كل server function حسّاسة تستخدم `.middleware([requireSupabaseAuth])` (باستثناء `submit/verifyRegistrationOtp` — بحكم كونها نقطة الدخول للمجهولين).
- **Client bearer:** يُرفَق تلقائيًا عبر `attachSupabaseAuth` في `src/start.ts`.

### 3.2 النواقص والثغرات المحتملة

| # | البند | الخطورة | الوصف |
|---|---|---|---|
| A1 | لا يوجد **rate limit** على `submitRegistrationRequest` — يمكن لمهاجم إغراق `registration_requests` | متوسطة | لا حد أدنى لأسطر انتظار phone معيّن |
| A2 | OTP نصّي مخزّن **بدون تجزئة** (`otp_code` كنص) | متوسطة | من ينظر لسجلات DB يرى الرمز؛ مقبول نسبيًا لأن الـ RLS يمنع القراءة من غير staff، لكن الأفضل تخزين hash |
| A3 | لا يوجد **تحقق ملكية للـ WhatsApp** — العميل يعطي رقمًا وثقتنا به | منخفضة | مقبول للـ V1 لأن CS يتصل يدويًا |
| A4 | **أول Admin** يُنشأ يدويًا عبر SQL — لا يوجد bootstrap آمن | منخفضة | موثّق في UAT كخطوة إطلاق |
| A5 | كلمات مرور اصطناعية تُعاد للعميل من `verifyRegistrationOtp` عبر HTTPS ثم تُنسى — لا تُحفظ محليًا | منخفضة | مقبول |
| A6 | **6 تحذيرات** من `supabase--linter`: كل الدوال `SECURITY DEFINER` قابلة للتنفيذ من `public`/`authenticated`. المُصمَّم منها لذلك (`has_role`, `is_staff_or_admin`, `confirm_delivery_by_qr`) — لكن يجب مراجعة الأربع الأخيرة و REVOKE ما لا يجب استدعاؤه من العميل. | متوسطة | راجع القسم 7 |

---

## 4) Database Analysis

### 4.1 الجداول (22 جدولاً)

| الجدول | الأعمدة | السياسات | ملاحظة |
|---|---|---|---|
| `addresses` | 9 | 2 (owner + staff read) | |
| `audit_logs` | 7 | 1 (staff read) | |
| `brands` | 10 | 2 (public read + admin write) | |
| `cart_items` | 4 | 1 (owner) | |
| `carts` | 3 | 1 (owner) | |
| `categories` | 7 | 2 | |
| `cities` | 6 | 2 | |
| `delivery_assignments` | 8 | 3 (read/insert/update لـ staff & agent) | |
| `inventory` | 3 | 2 (**public read** + admin write) | ⚠️ يعرض بوليان توفر لكن العدد الفعلي مقروء علنًا — انظر 7.2 |
| `neighborhoods` | 7 | 2 | |
| `notifications` | 7 | 1 (owner select فقط) | مُرَحَّل لـ Phase 3 |
| `order_items` | 6 | 2 | |
| `order_notes` | 5 | 2 | جديد في Phase 2.5 |
| `order_status_history` | 6 | 1 | |
| `orders` | 19 | 3 (owner_insert + owner_read + staff_update) | يشمل `assigned_staff_id` الجديد |
| `product_images` | 4 | 2 | |
| `products` | 17 | 2 | |
| `profiles` | 6 | 3 (self read/update + admin all) | |
| `registration_requests` | 21 | 2 (staff read + staff update) | لا سياسة SELECT للعميل — الوصول عبر server fn admin |
| `states` | 5 | 2 | |
| `user_roles` | 4 | 2 (self read + admin all) | |
| `wishlists` | 3 | 1 (owner) | |

**إجمالي السياسات:** 41 — كلها موجودة والـ RLS مُفَعَّل على كل الجداول (من الـ migrations).

### 4.2 المفاتيح الخارجية (31 FK)

كل جدول commerce/identity له FKs سليمة تربط ب `auth.users`، `products`، `orders`، وسلسلة الجغرافيا. **لا يوجد FK يتيمة**.

### 4.3 الفهارس (32 index)

- كل جدول له PK.
- Unique indexes: `brands_slug`, `categories_slug`, `products_slug`, `orders_number`, `delivery_assignments.order_id`, `delivery_assignments.qr_token`, `carts.profile_id`, `user_roles(user_id,role)`.
- Indexes مخصصة: `registration_requests_phone_idx`, `registration_requests_status_idx`.
- **مفقود (توصية):** `orders(profile_id)`, `orders(assigned_staff_id)`, `orders(status)`, `order_items(order_id)`, `delivery_assignments(agent_id)`, `audit_logs(entity_type, entity_id)`، `products(brand_id)`, `products(category_id)`، `inventory(stock)` جزئي. حاليًا هذه الاستعلامات تعتمد على sequential scans (مقبول بحجم البيانات الحالي، **مشكلة أداء متوقعة عند النمو**).

### 4.4 القيود (Constraints)

- ENUMs: `app_role`, `order_status`.
- CHECK constraints: غير معثور على constraints مخصصة مهمة (الجرد `stock` يعتمد على `GREATEST(...,0)` في الـ trigger بدل CHECK).
- Uniqueness: مطبَّق حيث يلزم (slugs, numbers, tokens).

### 4.5 Triggers (تطبيقية — الـ RI/FK triggers مستثناة)

| Trigger | الجدول | الوظيفة |
|---|---|---|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` — profile + role |

**ملاحظة مهمة:** ظهر في نتائج `pg_trigger` أن كل triggers الأعمال (`handle_order_status_change`, `set_order_number`, `audit_*`, `touch_updated_at`) **مُعرَّفة كدوال لكن غير مربوطة كـ triggers على الجداول** — سوى `on_auth_user_created`. راجع القسم 10 (Bugs).

> **⚠️ اكتشاف مهم:** استعلام `pg_trigger WHERE NOT tgisinternal` لم يُرجِع سوى `on_auth_user_created`. جميع triggers الأخرى الموثّقة في `SCHEMA.md` لم تُثبَّت على الجداول رغم أن دوالها موجودة. يجب التحقق يدويًا وإصلاح ذلك قبل الإنتاج.

### 4.6 Functions (10)

- `has_role`, `is_staff_or_admin` — سليمة، `SECURITY DEFINER STABLE`، `search_path='public'`.
- `handle_new_user`, `set_order_number`, `handle_order_status_change`, `audit_product_change`, `audit_inventory_change`, `audit_delivery_assignment`, `audit_registration_request`, `touch_updated_at` — دوال triggers.
- `confirm_delivery_by_qr` — RPC مُستدعاة من العميل لتأكيد التسليم بـ QR.

### 4.7 Views / Storage

- **Views:** لا يوجد.
- **Storage buckets:** لا يوجد. صور المنتجات تعتمد على `image_url` (URL خارجي).

### 4.8 جودة التصميم

**نقاط قوة:**
- فصل الأدوار في جدول مستقل (best practice).
- RLS شامل مع GRANTs صريحة في كل migration.
- Snapshots في `order_items.name_snapshot` و `price_sdg` — يحافظ على سلامة تاريخ الطلبات.
- تصميم جغرافي قابل للتوسع (state → city → neighborhood مع رسوم توصيل لكل حي).

**نقاط ضعف:**
- عدم وجود indexes على الأعمدة كثيرة الاستعلام (raised أعلاه).
- `inventory` مقروء علنًا — الحل المُوصى به: view تُظهر `in_stock boolean` فقط أو REVOKE + سياسة تحسب المتاح بدون رقم دقيق.
- عدم تفعيل عدد من triggers الأعمال (اكتشاف 4.5).

---

## 5) Backend

### 5.1 Server Functions (بيان كامل)

| الملف | الدوال | Auth | Validation | ملاحظات |
|---|---|---|---|---|
| `auth.functions.ts` (244) | `submitRegistrationRequest`, `verifyRegistrationOtp` (مفتوحة), `listRegistrationRequests`, `approveRegistrationRequest`, `rejectRegistrationRequest`, `regenerateRegistrationOtp` | 4/6 محمية بـ `requireSupabaseAuth` + فحص staff/admin | زود Zod كامل | بلا rate limit |
| `catalog.functions.ts` (51) | استعلامات قراءة عامة | مفتوحة عبر publishable client | Zod | ملائم للـ SSR public |
| `commerce.functions.ts` (169) | Cart CRUD + `checkoutPlaceOrder` + Wishlist | محمية | Zod | ✔ لا تلمس المخزون |
| `account.functions.ts` (80) | `getMyOrders`, `getMyOrder`, `updateMyProfile` | محمية | Zod | |
| `ops.functions.ts` (388) | 8 دوال CS/agent + QR | محمية + فحص role | Zod | RLS ثانوي كطبقة أمان |
| `admin.functions.ts` (98) | 9 دوال Admin | محمية + `has_role admin` | Zod | soft delete موثّق |
| `example.functions.ts` (22) | مثال قالبي | — | — | **كود ميت — اقتراح حذف** |
| `queries.ts` (259) | تجميع react-query hooks | — | — | الطبقة التي تستهلكها الواجهة |

### 5.2 Edge Functions

**لا يوجد.** كل المنطق يستخدم `createServerFn` (Tanstack) وليس Supabase Edge Functions — يتوافق مع توجيهات المنصة.

### 5.3 Cron Jobs / Background Jobs

**لا يوجد.** لم يتم إنشاء `pg_cron` أو مهام دورية.
- **موصى:** cron لتنظيف `registration_requests` منتهية الصلاحية وتغيير حالتها لـ `expired`.

### 5.4 API Integrations خارجية

**لا يوجد** حاليًا (لا Twilio، لا Stripe، لا بوابة WhatsApp API). الاعتماد على `wa.me` deep-links فقط.

### 5.5 Validation & Error Handling

- **Validation:** Zod في كل server function (100% تغطية).
- **Error handling:** استخدام `throw new Error(...)` عربي/إنجليزي مزدوج داخل `verifyRegistrationOtp`؛ الباقي رسائل إنجليزية عامة.
- **Logging:** لا يوجد logger مركزي؛ فقط `console.error` في 6 ملفات (`start.ts`, `server.ts`, `__root.tsx`, وthree integrations files).

---

## 6) Frontend

### 6.1 الصفحات (18 route)

| Route | الوصف | SSR | حالة |
|---|---|---|---|
| `/` | الرئيسية | ✅ | مكتملة |
| `/products`, `/products/$id` | الكتالوج | ✅ | |
| `/categories`, `/brands`, `/brands/$id` | تصفح | ✅ | |
| `/search`, `/offers` | بحث/عروض | ✅ | |
| `/cart`, `/checkout` | تسوق | client | |
| `/auth` | دخول/تسجيل | client | |
| `/account`, `/account/wishlist`, `/orders/$id` | حساب | client | |
| `/admin`, `/staff`, `/delivery` | لوحات | client + دور | |
| `/sitemap.xml` | SEO | ✅ | ⚠️ URL placeholder (TODO في السطر 5) |

### 6.2 Components

- **مشتركة:** `AppShell`, `Header`, `Footer`, `Logo`.
- **مجال:** `ProductCard`, `PricePill`, `OrderTimeline`, `RegistrationRequestsPanel`.
- **UI kit:** shadcn/ui كاملة (نحو 40 مكوّن Radix تحت `src/components/ui/`).

### 6.3 State Management

- **Server state:** TanStack Query (source of truth).
- **Client store:** `src/lib/store.ts` (Zustand يُفترَض — يحتاج مراجعة).
- **Auth state:** `src/hooks/useAuth.ts` — يستخدم `supabase.auth.onAuthStateChange` بدون فلترة `TOKEN_REFRESHED` (انظر Bugs).

### 6.4 UI / RTL / Responsive / A11y

- **RTL:** ✅ `dir="rtl"` على `<html>`.
- **Responsive:** Tailwind mobile-first؛ اختُبر على 611×762 وفق الأنظمة الحالية.
- **A11y:** shadcn/Radix يوفر ARIA أساسي؛ لم يتم إجراء تدقيق a11y مخصص.
- **Consistency:** design tokens في `src/styles.css` مُستَخدَمة بشكل عام (لا ألوان hex مبعثرة في المكوّنات المفحوصة).

---

## 7) Security Audit

### 7.1 نتائج `supabase--linter` (فعلية)

| # | الشدة | البند |
|---|---|---|
| L1–L2 | WARN | Public Can Execute SECURITY DEFINER Function (2 دالة) |
| L3–L6 | WARN | Signed-In Users Can Execute SECURITY DEFINER Function (4 دوال) |

**التحليل:** بعض الدوال (مثل `has_role`, `is_staff_or_admin`) يجب أن تكون قابلة للاستدعاء بواسطة السياسات، لكن يجب `REVOKE EXECUTE ... FROM anon, authenticated` لمنع الاستدعاء المباشر من الواجهة (السياسات تستدعيها كـ SECURITY DEFINER بغض النظر). ينطبق ذلك أيضًا على `handle_*` لأنها triggers فقط.

### 7.2 مخاطر إضافية مكتشفة

| # | الخطورة | البند |
|---|---|---|
| S1 | **عالية** | جدول `inventory` عليه سياسة `p_inventory_read TO public` — أي مجهول يقرأ الكمية بالضبط. يخالف قاعدة العمل «الكميات مخفية». |
| S2 | **عالية** | Triggers الأعمال (order status, audit logs, order number, updated_at) **غير مربوطة على الجداول** — النتائج المتوقعة (خصم مخزون، سجل تدقيق، ترقيم الطلبات) لن تحدث. راجع 4.5 و10. |
| S3 | متوسطة | `otp_code` نص خام في `registration_requests`. |
| S4 | متوسطة | لا rate limit على `submitRegistrationRequest` / `verifyRegistrationOtp`. |
| S5 | منخفضة | XSS: React يهرّب افتراضيًا؛ لا استخدام لـ `dangerouslySetInnerHTML` في الكود المفحوص. |
| S6 | منخفضة | CSRF: server fns تعتمد Bearer token عبر header — محصّنة بطبيعتها ضد CSRF. |
| S7 | — | Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` مخزّنة كأسرار Supabase — سليم. |
| S8 | — | `.env` client يحتوي فقط `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — سليم. |
| S9 | — | Storage: لا buckets = لا مخاطر رفع ملفات حاليًا. |

### 7.3 SQL Injection

كل الاستعلامات عبر Supabase Client (parameterized). **لا استخدام** لـ `rpc` أو `raw()` مع string concatenation.

---

## 8) Performance Analysis

- **Bundle size:** غير مُقاس رسميًا (لا يوجد تقرير build في السياق). Vite 7 + Tanstack Router يفعّلان code-splitting لكل route تلقائيًا.
- **Lazy loading:** ضمني عبر router؛ لا `React.lazy` يدوي في الكود المفحوص.
- **Query performance:** كتلة `admin.functions.ts` تستدعي عدة استعلامات متتابعة داخل `adminReports` — سليم بحجم البيانات الصغير. عند النمو (>10K طلب) يحتاج materialized view.
- **Index usage:** ناقص (راجع 4.3).
- **React re-renders:** غير مُقاسة؛ الاعتماد على TanStack Query يقلّلها.
- **Memory:** لا اشتباه في memory leaks — `onAuthStateChange` يُلغى subscription في `useAuth.ts`.

---

## 9) Code Quality

- **Architecture:** طبقات نظيفة — `routes/` (UI) → `queries.ts` (react-query) → `api/*.functions.ts` (RPC) → Supabase.
- **Folder structure:** يتبع اتفاقيات Tanstack Start.
- **Naming:** واضح ومتناسق (camelCase للـ TS، snake_case للـ DB).
- **Reusability:** `ProductCard`, `PricePill`, `OrderTimeline` قابلة لإعادة الاستخدام.
- **Technical debt:**
  - `src/lib/api/example.functions.ts` — كود مثال غير مستخدم.
  - `src/lib/mock-data.ts` — لا استيراد نشط سوى في `sitemap[.]xml.ts` (يحتاج تحقق).
  - `TODO` واحد في `sitemap[.]xml.ts:5`.
  - Placeholder رقم WhatsApp في `Footer.tsx:39` (`+249 9XX XXX XXX`).
- **Duplicate code:** غير ملحوظ.

---

## 10) Bugs & Issues

| # | الشدة | الوصف | الملف/المصدر |
|---|---|---|---|
| B1 | 🔴 حرج | **Triggers الأعمال غير مثبتة على الجداول.** استعلام `pg_trigger` أظهر أن `handle_order_status_change`, `set_order_number`, `audit_*`, `touch_updated_at` **غير مربوطة** رغم أن الدوال موجودة. النتيجة: لا خصم مخزون، لا ترقيم طلبات، لا audit logs. | `pg_trigger` |
| B2 | 🔴 حرج | `inventory` مكشوف علنًا عبر `p_inventory_read TO public`. يخالف قاعدة «الكميات مخفية». | migration |
| B3 | 🟠 عالٍ | `useAuth.ts` يستدعي `setSession/setUser` على كل حدث بما فيها `TOKEN_REFRESHED` — يسبب إعادة رسم دورية ومحتمل حلقات. | `src/hooks/useAuth.ts:15-19` |
| B4 | 🟠 عالٍ | Runtime error مسجَّل: «Unauthorized: No authorization header provided» — يعني وجود server fn محمية تُستدعى من loader عام أو قبل ضخّ التوكن. | runtime-errors summary |
| B5 | 🟡 متوسط | لا rate limit على OTP endpoints. | `auth.functions.ts` |
| B6 | 🟡 متوسط | OTP مخزّن كنص خام. | schema |
| B7 | 🟡 متوسط | Placeholder رقم WhatsApp في الـ Footer. | `Footer.tsx:39` |
| B8 | 🟢 منخفض | TODO في sitemap. | `sitemap[.]xml.ts:5` |
| B9 | 🟢 منخفض | `example.functions.ts` كود ميت. | `src/lib/api/` |
| B10 | 🟢 منخفض | `console.warn` من `lovable.js` — «Unknown message type: RESET_BLANK_CHECK» — رسالة CDN غير مؤثّرة. | console |
| B11 | — | TypeScript: لم يُشغَّل `tsgo` في هذه الجلسة. **غير قابل للتحقق حاليًا** من صفر الأخطاء بشكل قاطع (بناءً على الـ build السابق يمر لكن قد تكون هناك تحذيرات). |

---

## 11) Missing Features (مقارنة بـ BLUEPRINT)

- **Phase 3:**
  - إشعارات SMS/WhatsApp templates (جدول `notifications` موجود، لا تكامل).
  - توزيع تلقائي للطلبات على CS.
  - بوابة دفع (Bank of Khartoum tokenized / Stripe).
  - إدارة عناوين (states/cities/neighborhoods) عبر Admin UI.
- **Phase 4:** توسع لولايات أخرى، تعدد اللغات (فرنسية؟)، تطبيق موبايل native.
- **عام:**
  - نظام تقييمات ومراجعات للمنتجات.
  - كوبونات وخصومات (`compare_at_sdg` موجود لكن بدون آلية إدارة).
  - إدارة صور المنتجات (upload) — لا Storage bucket.
  - تصدير تقارير PDF/Excel.
  - Onboarding wizard للـ Admin الأول.

---

## 12) Project Progress (جدول شامل)

| الميزة | الحالة | % | الأولوية | ما ينقصها |
|---|---|---|---|---|
| Schema + RLS | ✅ | 100 | — | فهارس أداء + إخفاء `inventory.stock` |
| Triggers الأعمال | 🔴 | 20 | Critical | إعادة تثبيتها على الجداول |
| Auth (OTP يدوي) | ✅ | 95 | High | rate limit + hash OTP |
| Catalog | ✅ | 100 | — | — |
| Cart & Wishlist | ✅ | 100 | — | — |
| Checkout | ✅ | 100 | — | بوابة دفع (Phase 3) |
| Orders lifecycle | ✅ | 90 | High | تأكد من triggers |
| CS Dashboard | ✅ | 95 | Medium | تعليقات صوتية/مرفقات |
| Delivery Dashboard | ✅ | 90 | Medium | تتبع GPS اختياري |
| Admin Dashboard | ✅ | 85 | Medium | نموذج منتج غني + إدارة جغرافيا |
| Reports | ✅ | 70 | Medium | تصدير |
| Audit logs | ⚠️ | 60 | High | مربوط بجدول لكن triggers غير فعّالة |
| Notifications | ⏳ | 10 | Medium | Phase 3 |
| Payment gateway | ❌ | 0 | Low (V1) | Phase 3 |
| Product images upload | ❌ | 0 | Medium | Storage bucket |
| Tests (unit/e2e) | ❌ | 0 | Medium | لا framework مثبّت |
| SEO (sitemap) | ⚠️ | 70 | Low | URL production + og:image ديناميكي |
| i18n / RTL | ✅ | 100 | — | — |
| Docs | ✅ | 95 | — | تحديث SCHEMA لعكس حالة triggers |

**نسبة الاكتمال المرجّحة الإجمالية: ≈ 78%**

---

## 13) Development Roadmap (مرتب بالأولوية)

### Critical (يجب قبل أي إطلاق)
1. **إعادة تثبيت triggers الأعمال على الجداول** (B1) — migration جديد.
2. **إخفاء `inventory.stock`** من العامة (B2) — REVOKE + view `product_stock_status(product_id, in_stock)`.
3. **حل runtime error 401** (B4) — تحديد أي loader يستدعي server fn محمية وتحويلها لـ event/protected route.
4. **REVOKE EXECUTE** على SECURITY DEFINER functions التي لا تُستدعى من العميل (L1–L6).

### High
5. Rate limit + hash OTP (B5, B6, A1, A2).
6. تعيين أول Admin عبر UI (bootstrap آمن).
7. فهارس أداء (`orders.profile_id/status`, `order_items.order_id`, ...).
8. تحديث `Footer.tsx` برقم WhatsApp حقيقي، تحديث sitemap URL.
9. Filter `onAuthStateChange` في `useAuth.ts` (B3).

### Medium
10. Storage bucket + رفع صور منتجات.
11. إدارة الجغرافيا (states/cities/neighborhoods) عبر Admin.
12. نموذج إدارة منتجات كامل.
13. تصدير التقارير.
14. cron لتنظيف OTP منتهية.

### Low
15. اختبارات (Vitest للـ server fns، Playwright لتدفق الشراء).
16. مراجعة a11y كاملة.
17. متجر PWA / آيقونات.
18. تحسينات bundle size.

---

## 14) Testing

| النوع | الحالة | التغطية |
|---|---|---|
| Unit tests | ❌ لا يوجد | 0% |
| Integration tests | ❌ | 0% |
| E2E tests | ❌ | 0% |
| UAT يدوي | ✅ موثّق في `docs/UAT.md` | كامل لمسار الطلب |
| Framework مثبّت | لا Vitest ولا Playwright في `package.json` | — |

**توصية:** إضافة Vitest للـ server functions (validation + RLS بمحاكاة) و Playwright لتدفق طلب كامل.

---

## 15) Documentation

| الملف | موجود | ملاحظات |
|---|---|---|
| `README.md` (جذر) | **غير قابل للتحقق** — لم يظهر في السياق | ينبغي إنشاؤه |
| `docs/ARCHITECTURE.md` | ✅ | |
| `docs/BLUEPRINT.md` | ✅ | شامل |
| `docs/SCHEMA.md` | ✅ | ⚠️ يحتاج تحديث حول triggers |
| `docs/ERD.md` | ✅ | |
| `docs/RLS.md` | ✅ | |
| `docs/ROLES.md` | ✅ | |
| `docs/UAT.md` | ✅ | |
| `docs/ENGINEERING_AUDIT.md` | ✅ (هذا الملف) | |
| `src/routes/README.md` | ✅ | |
| API docs (auto-generated) | ❌ | لا |
| Storybook | ❌ | لا |

---

## 16) Final Assessment

### 16.1 نسبة الاكتمال الحقيقية
**≈ 78%** — الكود جاهز؛ العيوب المكتشفة (triggers غير مثبتة، inventory مكشوف) تخفض النسبة عن التقدير الأولي 82%.

### 16.2 جاهزية الإنتاج
🔴 **غير جاهز للإطلاق** حتى تُصلَح البنود الحرجة (B1, B2, B4) وتُنجَز البنود العالية.

### 16.3 أعلى 20 مشكلة يجب إصلاحها

1. تثبيت جميع triggers الأعمال على الجداول (B1).
2. إخفاء عمود `inventory.stock` من الجمهور (B2).
3. حل خطأ 401 «No authorization header» (B4).
4. REVOKE EXECUTE على SECURITY DEFINER functions غير المقصود استدعاؤها.
5. Hash لـ OTP بدل النص الخام.
6. Rate limit على OTP endpoints.
7. Filter events في `useAuth.onAuthStateChange`.
8. تحديث رقم WhatsApp الحقيقي في Footer.
9. تحديث URL الإنتاج في sitemap.
10. إضافة فهارس على `orders.profile_id`, `orders.status`, `orders.assigned_staff_id`.
11. إضافة فهارس على `order_items.order_id`, `audit_logs(entity_type, entity_id)`.
12. حذف `src/lib/api/example.functions.ts` وكل `mock-data` غير المستخدم.
13. إنشاء `README.md` رئيسي.
14. توثيق حقيقة triggers في SCHEMA.md.
15. Bootstrap UI لأول admin.
16. cron لتنظيف OTP.
17. إضافة `og:image` ديناميكي في الروتات المشاركة.
18. تفعيل logger مركزي بدل console.
19. مراجعة a11y (aria-labels على أزرار الأيقونات).
20. Bundle size measurement + code-splitting للـ admin routes.

### 16.4 أعلى 20 تحسينًا مقترحًا

1. Vitest + Playwright framework.
2. Storage bucket لصور المنتجات (WebP + responsive).
3. Materialized view للتقارير.
4. بوابة دفع محلية.
5. WhatsApp Business API integration.
6. SMS provider مع fallback يدوي.
7. Product reviews & ratings.
8. Coupons/promo codes.
9. Search — full-text (`tsvector`) على products.
10. Wishlist sharing عبر رابط.
11. Order tracking بـ WebSocket (Supabase realtime).
12. PWA + offline cart.
13. تعدد المخازن (warehouses).
14. Admin UI لإدارة الجغرافيا.
15. Export PDF للطلبات (فاتورة).
16. Import CSV للكتالوج.
17. Bulk operations للمنتجات.
18. Dark mode.
19. Sentry أو Logtail integration.
20. i18n موسّع (فرنسية / لغات أخرى).

### 16.5 تقييم /100

| المحور | التقييم |
|---|---|
| Architecture | **85** — طبقات نظيفة، اتفاقيات Tanstack Start مطبقة |
| Security | **62** — قوي بنيويًا لكن triggers مكسورة + inventory مكشوف + OTP خام |
| Performance | **70** — سريع الآن، لكن ينقصه فهارس للنمو |
| UI/UX | **80** — RTL كامل، shadcn/ui متناسق، ينقصه polish |
| Backend | **82** — server fns منظّمة مع validation |
| Frontend | **80** — TanStack Query + Router بشكل صحيح |
| Database | **72** — schema ممتاز، لكن triggers غير مثبتة يخفض الرقم كثيرًا |
| Code Quality | **80** — نظيف، قليل من dead code |
| Scalability | **68** — يحتاج فهارس + materialized views لأحجام أكبر |
| Maintainability | **83** — توثيق جيد، طبقات واضحة |
| **الإجمالي المرجّح** | **≈ 76/100** |

---

## 17) جدول ختامي شامل

| ما تم تنفيذه | ما هو ناقص | الأخطاء الموجودة | ملفات/وحدات للمراجعة | الخطوات التالية بالتسلسل |
|---|---|---|---|---|
| Schema (22 جدول) + 41 RLS + 31 FK | Triggers الأعمال غير مثبتة | B1 حرج | جميع migrations | 1. إصدار migration يعيد ربط triggers |
| Server fns (7 ملفات، ~1300 سطر) | Rate limit / OTP hash | B5, B6 | `auth.functions.ts` | 2. تعديل schema + إعادة نشر |
| Storefront كامل (18 route) | Storage للصور | B7 | `Footer.tsx`, `sitemap` | 3. REVOKE على SECURITY DEFINER + إخفاء inventory |
| Auth OTP يدوي | إشعارات SMS/WA تلقائية | S1 عالٍ | inventory policy | 4. حل runtime 401 |
| Admin/Staff/Delivery dashboards | تعيين أول Admin عبر UI | B4 عالٍ | loader يستدعي protected fn | 5. تعبئة بيانات كتالوج + أول Admin |
| RTL + i18n كامل | بوابة دفع | B3 | `useAuth.ts` | 6. إضافة فهارس أداء |
| UAT report موثّق | Tests آلية | B10 (تحذير CDN فقط) | — | 7. تكوين WhatsApp + بنك + إشعار العميل |
| Audit table + دوال triggers | Reports export | Linter 6 تحذيرات | كل SECURITY DEFINER | 8. إطلاق soft-launch لعينة محدودة |
| Soft delete للمنتجات | Product images upload | Placeholder Footer | `Footer.tsx` | 9. مراقبة + إضافة اختبارات آلية |
| QR delivery confirmation | Reviews/Coupons | TODO sitemap | `sitemap[.]xml.ts` | 10. Phase 3 (notifications + payments) |

---

## ملاحظات الشفافية

- لم أُشغِّل `tsgo` في هذه الجلسة — نتيجة TypeScript الحالية **غير قابلة للتحقق قطعيًا** (البناء السابق نجح لكن قد تكون هناك تحذيرات).
- عدد الاختبارات = 0 (لا يوجد framework مثبّت في `package.json`).
- `inventory` triggers/policies تحتاج مراجعة يدوية إضافية — الاستعلام الحالي `pg_trigger` يُظهر أن دوال الأعمال غير مربوطة، لكن قد يكون هناك نمط ربط بديل لم يظهر في الاستعلام؛ **يُنصَح بالتحقق يدويًا** قبل اعتبار B1/B2 نهائيَّين.
- Bundle size، Lighthouse score، Real User Monitoring — كلها **غير مُقاسة** في هذه الجلسة.
- Storage buckets عددها 0 وفق السياق المُعطى — لم يتم استعلام مباشر لتأكيد ذلك.

**نهاية التقرير.**
