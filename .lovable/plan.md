# خطة: تقرير هندسي شامل للمشروع (Metacare Beauty Engineering Audit)

## الهدف
إنشاء ملف واحد `docs/ENGINEERING_AUDIT.md` باللغة العربية يحتوي على تحليل دقيق ومفصّل للمشروع كما هو **موجود فعليًا في الكود وقاعدة البيانات**، بدون افتراضات. أي معلومة غير قابلة للتحقق ستُذكر صراحةً كذلك.

## منهجية الفحص (قبل الكتابة)
سأقوم بفحص فعلي للمصادر التالية:

1. **الكود الأمامي (Frontend)**
   - كل الملفات في `src/routes/` (14 route file)
   - `src/components/`, `src/hooks/`, `src/i18n/`, `src/lib/`
   - `src/router.tsx`, `src/start.ts`, `src/server.ts`, `src/styles.css`

2. **الكود الخلفي (Server Functions)**
   - جميع ملفات `src/lib/api/*.functions.ts` (auth, catalog, commerce, account, ops, admin)
   - `src/lib/config.server.ts`, `src/integrations/supabase/*`

3. **قاعدة البيانات**
   - جميع الـ migrations في `supabase/migrations/`
   - استعلام مباشر عبر `psql` للتحقق من: الجداول، الأعمدة، الـ RLS policies، الـ triggers، الـ functions، الـ grants، الـ indexes، الـ foreign keys
   - `supabase--linter` لكشف مشاكل الأمان والأداء
   - Storage buckets (لا يوجد حاليًا حسب السياق)

4. **التهيئة والبيئة**
   - `package.json`, `vite.config.ts`, `tsconfig.json`, `supabase/config.toml`, `.env`
   - قائمة الأسرار (secrets) الموجودة

5. **التوثيق الحالي**
   - `docs/SCHEMA.md`, `docs/ERD.md`, `docs/ROLES.md`, `docs/RLS.md`, `docs/BLUEPRINT.md`, `docs/UAT.md`, `docs/ARCHITECTURE.md`

6. **فحوصات جودة**
   - `tsgo` للتحقق من أخطاء TypeScript
   - `rg` للبحث عن TODO/FIXME/console.log/mock data/dead code
   - فحص وجود اختبارات (unit/integration/e2e)

## هيكل التقرير

سيحتوي `docs/ENGINEERING_AUDIT.md` على 16 قسمًا كما طلبت بالضبط:

1. **Executive Summary** — ملخص + نسبة إنجاز محسوبة + الحالة الحالية
2. **Functional Modules** — جدول لكل وحدة (Auth, Catalog, Cart, Checkout, Orders, Delivery, Admin, CS, Reports) مع Routes/Components/Hooks/Services/Tables/API/الحالة
3. **Authentication & Authorization** — نظام OTP اليدوي، الأدوار (admin/staff/agent/customer)، has_role، الثغرات
4. **Database Analysis** — تحليل كامل مبني على استعلام حي: 22 جدول، RLS policies، 10 functions، triggers، grants، indexes
5. **Backend** — كل server function مع endpoint، validation (zod)، error handling
6. **Frontend** — تحليل الصفحات، RTL/i18n، الاستجابة، إمكانية الوصول
7. **Security Audit** — فحص فعلي مع نتائج `supabase--linter`
8. **Performance Analysis** — bundle، lazy loading، query indexes
9. **Code Quality** — architecture، naming، dead code، duplication
10. **Bugs & Issues** — نتائج tsgo + فحص يدوي
11. **Missing Features** — مقارنة بين BLUEPRINT.md والواقع
12. **Project Progress** — جدول شامل (feature/status/%/priority/gaps)
13. **Development Roadmap** — Critical / High / Medium / Low
14. **Testing** — الحالة الفعلية (لا يوجد إطار اختبارات مثبت)
15. **Documentation** — جرد الملفات الموجودة في `docs/`
16. **Final Assessment** — نسبة اكتمال، جاهزية إنتاج، أعلى 20 مشكلة، أعلى 20 تحسين، تقييم /100 لعشرة محاور، وجدول ختامي شامل (تم/ناقص/أخطاء/ملفات للمراجعة/الخطوات التالية بالتسلسل)

## قواعد الالتزام
- كل رقم أو حقيقة → مصدرها ملف أو استعلام DB (سيتم ذكر المصدر بجانبها عند الحاجة)
- أي بند غير قابل للتحقق → يُكتب صراحةً: **«غير قابل للتحقق من الكود»**
- لا تعديل على أي ملف باستثناء إنشاء `docs/ENGINEERING_AUDIT.md`
- التقرير بالعربية بالكامل مع مصطلحات تقنية بالإنجليزية عند الضرورة
- الحجم المتوقع: 1500–2500 سطر markdown

## المخرجات
ملف واحد جديد: `docs/ENGINEERING_AUDIT.md`

لن يتم تعديل أي كود أو schema أو بيانات — التقرير للقراءة فقط.
