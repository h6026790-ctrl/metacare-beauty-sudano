import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { products, brands, categories, sampleOrders, sampleCustomers, findCustomer } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";
import {
  LayoutDashboard, Package, Users, Tags, Truck, BarChart3, Image as ImageIcon,
  ShoppingBag, UserCog, Plus, Pencil, Eye, TrendingUp, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Metacare" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const { t, lang } = useI18n();
  const todayOrders = sampleOrders.filter((o) => o.placedAt.startsWith("2026-06-04"));
  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);
  const pendingReview = sampleOrders.filter((o) => o.status === "new" || o.status === "review").length;

  return (
    <PanelShell title={t.panels.admin.title} sub={t.panels.admin.sub} accent="primary">
      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={ShoppingBag} label={lang === "ar" ? "طلبات اليوم" : "Orders today"} value={String(todayOrders.length)} trend="+12%" />
        <Kpi icon={TrendingUp} label={lang === "ar" ? "إيرادات اليوم" : "Revenue today"} value={formatPrice(revenueToday, lang)} trend="+8%" />
        <Kpi icon={Clock} label={lang === "ar" ? "بانتظار المراجعة" : "Pending review"} value={String(pendingReview)} tone="warning" />
        <Kpi icon={Users} label={lang === "ar" ? "العملاء النشطون" : "Active customers"} value={String(sampleCustomers.length)} trend="+2" />
      </div>

      <Tabs defaultValue="overview" className="mt-6 space-y-5">
        <TabsList className="flex flex-wrap gap-1 rounded-2xl bg-card p-1 shadow-glass">
          <Tab value="overview" icon={LayoutDashboard}>{lang === "ar" ? "نظرة عامة" : "Overview"}</Tab>
          <Tab value="orders" icon={ShoppingBag}>{lang === "ar" ? "الطلبات" : "Orders"}</Tab>
          <Tab value="products" icon={Package}>{lang === "ar" ? "المنتجات" : "Products"}</Tab>
          <Tab value="catalog" icon={Tags}>{lang === "ar" ? "الأقسام والعلامات" : "Catalog"}</Tab>
          <Tab value="customers" icon={Users}>{lang === "ar" ? "العملاء" : "Customers"}</Tab>
          <Tab value="team" icon={UserCog}>{lang === "ar" ? "الفريق" : "Team"}</Tab>
          <Tab value="content" icon={ImageIcon}>{lang === "ar" ? "المحتوى" : "Content"}</Tab>
          <Tab value="reports" icon={BarChart3}>{lang === "ar" ? "التقارير" : "Reports"}</Tab>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <Section title={lang === "ar" ? "آخر الطلبات" : "Recent orders"}>
            <OrdersTable orders={sampleOrders.slice(0, 5)} />
          </Section>
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title={lang === "ar" ? "أفضل المنتجات مبيعاً" : "Top selling products"}>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                {products.filter((p) => p.isBestSeller).slice(0, 5).map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 p-3">
                    <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <img src={p.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    <span className="flex-1 truncate text-sm text-foreground">{p.name[lang]}</span>
                    <span className="text-xs text-muted-foreground">{formatPrice(p.price, lang)}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title={lang === "ar" ? "تنبيهات المخزون" : "Inventory alerts"}>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                {products.filter((p) => p.stock <= 10).slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-3">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${p.stock === 0 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-foreground"}`}>
                      <AlertCircle className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 truncate text-sm text-foreground">{p.name[lang]}</span>
                    <span className="text-xs text-muted-foreground">{p.stock === 0 ? (lang === "ar" ? "نفذ" : "Out") : `${p.stock} ${lang === "ar" ? "متبقي" : "left"}`}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Section title={lang === "ar" ? "كل الطلبات" : "All orders"} action={lang === "ar" ? "تصدير" : "Export"}>
            <OrdersTable orders={sampleOrders} />
          </Section>
        </TabsContent>

        <TabsContent value="products">
          <Section title={lang === "ar" ? "كل المنتجات" : "All products"} action={lang === "ar" ? "إضافة منتج" : "Add product"} actionIcon={Plus}>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-start text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>{lang === "ar" ? "المنتج" : "Product"}</Th>
                    <Th>{lang === "ar" ? "العلامة" : "Brand"}</Th>
                    <Th>{lang === "ar" ? "القسم" : "Category"}</Th>
                    <Th align="end">{lang === "ar" ? "السعر" : "Price"}</Th>
                    <Th align="end">{lang === "ar" ? "المخزون" : "Stock"}</Th>
                    <Th align="end">{lang === "ar" ? "إجراء" : "Action"}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => {
                    const b = brands.find((x) => x.id === p.brandId);
                    const c = categories.find((x) => x.id === p.categoryId);
                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <img src={p.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                            <span className="line-clamp-1 text-foreground">{p.name[lang]}</span>
                          </div>
                        </Td>
                        <Td>{b?.name[lang]}</Td>
                        <Td>{c?.name[lang]}</Td>
                        <Td align="end">{formatPrice(p.price, lang)}</Td>
                        <Td align="end">
                          <span className={p.stock === 0 ? "text-destructive" : p.stock <= 10 ? "text-warning-foreground" : "text-foreground"}>
                            {p.stock}
                          </span>
                        </Td>
                        <Td align="end">
                          <button className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted">
                            <Pencil className="h-3 w-3" /> {lang === "ar" ? "تعديل" : "Edit"}
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="catalog">
          <div className="grid gap-4 md:grid-cols-2">
            <Section title={lang === "ar" ? "الأقسام" : "Categories"} action={lang === "ar" ? "إضافة" : "Add"} actionIcon={Plus}>
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                    <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl gradient-aurora text-lg">{c.icon}</span><span className="text-sm font-medium text-foreground">{c.name[lang]}</span></span>
                    <span className="text-xs text-muted-foreground">{products.filter((p) => p.categoryId === c.id).length}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title={lang === "ar" ? "العلامات" : "Brands"} action={lang === "ar" ? "إضافة" : "Add"} actionIcon={Plus}>
              <ul className="space-y-2">
                {brands.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                    <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand font-display text-base text-primary-foreground">{b.name[lang].slice(0, 1)}</span><span className="text-sm font-medium text-foreground">{b.name[lang]}</span></span>
                    <span className="text-xs text-muted-foreground">{products.filter((p) => p.brandId === b.id).length}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Section title={lang === "ar" ? "العملاء" : "Customers"}>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-start text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>{lang === "ar" ? "الاسم" : "Name"}</Th>
                    <Th>{lang === "ar" ? "الجوال" : "Phone"}</Th>
                    <Th>{lang === "ar" ? "الحي" : "Neighborhood"}</Th>
                    <Th align="end">{lang === "ar" ? "الطلبات" : "Orders"}</Th>
                    <Th align="end">{lang === "ar" ? "الإجمالي" : "Lifetime"}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sampleCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <Td><span className="font-medium text-foreground">{c.name}</span></Td>
                      <Td><span dir="ltr">{c.phone}</span></Td>
                      <Td>{c.neighborhood}</Td>
                      <Td align="end">{c.ordersCount}</Td>
                      <Td align="end">{formatPrice(c.totalSpent, lang)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid gap-4 md:grid-cols-2">
            <Section title={lang === "ar" ? "خدمة العملاء" : "Customer service"} action={lang === "ar" ? "دعوة" : "Invite"} actionIcon={Plus}>
              <Member name="خدمة 1" role={lang === "ar" ? "مسؤولة وردية الصباح" : "Morning shift"} stat={`${sampleOrders.filter((o) => o.assignedTo?.staff === "خدمة 1").length} ${lang === "ar" ? "طلباً" : "orders"}`} />
              <Member name="خدمة 2" role={lang === "ar" ? "مسؤولة وردية المساء" : "Evening shift"} stat={`${sampleOrders.filter((o) => o.assignedTo?.staff === "خدمة 2").length} ${lang === "ar" ? "طلباً" : "orders"}`} />
            </Section>
            <Section title={lang === "ar" ? "المندوبون" : "Delivery agents"} action={lang === "ar" ? "دعوة" : "Invite"} actionIcon={Plus}>
              <Member name="مندوب 1" role={lang === "ar" ? "نشط الآن" : "On duty"} stat={`${sampleOrders.filter((o) => o.assignedTo?.agent === "مندوب 1").length} ${lang === "ar" ? "توصيل" : "deliveries"}`} />
              <Member name="مندوب 2" role={lang === "ar" ? "نشط الآن" : "On duty"} stat={`${sampleOrders.filter((o) => o.assignedTo?.agent === "مندوب 2").length} ${lang === "ar" ? "توصيل" : "deliveries"}`} />
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Section title={lang === "ar" ? "بانرات الصفحة الرئيسية" : "Homepage banners"} action={lang === "ar" ? "إضافة بانر" : "Add banner"} actionIcon={Plus}>
            <div className="grid gap-3 md:grid-cols-2">
              <Banner title={lang === "ar" ? "بانر الهيرو" : "Hero banner"} sub={lang === "ar" ? "نشِط" : "Active"} />
              <Banner title={lang === "ar" ? "عرض الأسبوع" : "Weekly offer"} sub={lang === "ar" ? "ينتهي بعد ٣ أيام" : "Ends in 3 days"} />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid gap-4 md:grid-cols-3">
            <ReportCard label={lang === "ar" ? "المبيعات الأسبوعية" : "Weekly sales"} value={formatPrice(842000, lang)} delta="+18%" />
            <ReportCard label={lang === "ar" ? "متوسط قيمة الطلب" : "Average order value"} value={formatPrice(108000, lang)} delta="+4%" />
            <ReportCard label={lang === "ar" ? "نسبة التحويل" : "Conversion rate"} value="3.6%" delta="+0.4%" />
          </div>
          <Section title={lang === "ar" ? "حالات الطلبات" : "Orders by status"} className="mt-5">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(["new","review","paid","shipping","delivered"] as const).map((s) => {
                const n = sampleOrders.filter((o) => o.status === s).length;
                return (
                  <div key={s} className="rounded-2xl border border-border bg-card p-4 text-center shadow-glass">
                    <OrderStatusBadge status={s} />
                    <p className="mt-2 font-display text-3xl text-foreground">{n}</p>
                  </div>
                );
              })}
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </PanelShell>
  );
}

/* ---------- Shell + helpers (exported for staff/delivery) ---------- */

export function PanelShell({ title, sub, accent, children }: { title: string; sub: string; accent: "primary" | "violet" | "accent"; children: React.ReactNode }) {
  const { t, lang } = useI18n();
  const bg = accent === "violet" ? "from-violet to-primary" : accent === "accent" ? "from-accent to-primary" : "from-primary to-accent";
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className={`mb-6 overflow-hidden rounded-3xl bg-gradient-to-br ${bg} p-6 text-primary-foreground shadow-elevated md:p-8`}>
          <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium backdrop-blur">{t.panels.previewBadge}</span>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">{title}</h1>
          <p className="mt-1 text-sm opacity-90">{sub}</p>
        </div>
        {children}
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">
          {lang === "ar" ? "هذه واجهة معاينة بمعطيات تجريبية. الربط بقاعدة البيانات يأتي في المرحلة الثانية." : "Prototype surface with sample data. Live data lands in Phase 2."}
          {" "}
          <Link to="/" className="text-primary hover:underline">{t.confirm.backHome}</Link>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ icon: Icon, label, value, trend, tone }: { icon: typeof Package; label: string; value: string; trend?: string; tone?: "warning" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-glass">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone === "warning" ? "bg-warning/15 text-warning-foreground" : "gradient-brand text-primary-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">{trend}</span>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl text-foreground">{value}</p>
    </div>
  );
}

function Tab({ value, icon: Icon, children }: { value: string; icon: typeof Package; children: React.ReactNode }) {
  return (
    <TabsTrigger value={value} className="gap-1.5 rounded-xl px-3 py-2 text-xs data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{children}</span>
    </TabsTrigger>
  );
}

function Section({ title, action, actionIcon: ActionIcon, children, className }: { title: string; action?: string; actionIcon?: typeof Plus; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-end justify-between">
        <h3 className="font-display text-lg text-foreground md:text-xl">{title}</h3>
        {action && (
          <button className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-glow">
            {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function OrdersTable({ orders }: { orders: typeof sampleOrders }) {
  const { lang } = useI18n();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-start text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{lang === "ar" ? "رقم" : "Number"}</Th>
            <Th>{lang === "ar" ? "العميلة" : "Customer"}</Th>
            <Th align="end">{lang === "ar" ? "الإجمالي" : "Total"}</Th>
            <Th>{lang === "ar" ? "الحالة" : "Status"}</Th>
            <Th align="end">{lang === "ar" ? "إجراء" : "Action"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => {
            const c = findCustomer(o.customerId);
            return (
              <tr key={o.number} className="hover:bg-muted/30">
                <Td><span className="font-mono text-xs tracking-wider text-foreground">{o.number}</span></Td>
                <Td><span className="text-foreground">{c?.name}</span></Td>
                <Td align="end">{formatPrice(o.total, lang)}</Td>
                <Td><OrderStatusBadge status={o.status} /></Td>
                <Td align="end">
                  <button className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted">
                    <Eye className="h-3 w-3" />{lang === "ar" ? "عرض" : "View"}
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Member({ name, role, stat }: { name: string; role: string; stat: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full gradient-aurora font-display text-base text-primary">{name.slice(0, 1)}</span>
        <div><p className="text-sm font-medium text-foreground">{name}</p><p className="text-[11px] text-muted-foreground">{role}</p></div>
      </div>
      <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">{stat}</span>
    </div>
  );
}

function Banner({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-glass">
      <div className="aspect-[2/1] rounded-xl gradient-hero" />
      <div className="mt-3 flex items-center justify-between">
        <div><p className="text-sm font-medium text-foreground">{title}</p><p className="text-[11px] text-muted-foreground">{sub}</p></div>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-success/15 text-success"><CheckCircle2 className="h-3.5 w-3.5" /></span>
      </div>
    </div>
  );
}

function ReportCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-success">{delta}</p>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "end" }) {
  return <th className={`px-3 py-2.5 font-medium ${align === "end" ? "text-end" : "text-start"}`}>{children}</th>;
}
function Td({ children, align }: { children: React.ReactNode; align?: "end" }) {
  return <td className={`px-3 py-2.5 ${align === "end" ? "text-end" : "text-start"}`}>{children}</td>;
}
