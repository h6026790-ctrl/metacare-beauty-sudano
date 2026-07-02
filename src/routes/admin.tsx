// Live Admin dashboard — products, inventory, orders, brands, categories, team, audit.
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListAllOrders, adminListProducts, adminAdjustStock,
  adminListAuditLogs, adminListCustomers, adminListBrands, listTeam,
} from "@/lib/api/ops.functions";
import { adminSoftDeleteProduct, adminRestoreProduct, adminReports } from "@/lib/api/admin.functions";
import { formatPrice, formatDate } from "@/lib/format";
import { LayoutDashboard, Package, Users, Tags, BarChart3, ShoppingBag, UserCog, AlertCircle, Pencil, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RegistrationRequestsPanel } from "@/components/RegistrationRequestsPanel";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Metacare" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const { t, lang } = useI18n();
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const ordersFn = useServerFn(adminListAllOrders);
  const productsFn = useServerFn(adminListProducts);
  const stockFn = useServerFn(adminAdjustStock);
  const auditFn = useServerFn(adminListAuditLogs);
  const custFn = useServerFn(adminListCustomers);
  const brandsFn = useServerFn(adminListBrands);
  const teamFn = useServerFn(listTeam);
  const softDelFn = useServerFn(adminSoftDeleteProduct);
  const restoreFn = useServerFn(adminRestoreProduct);
  const reportsFn = useServerFn(adminReports);

  const orders = useQuery({ queryKey: ["adm-orders"], queryFn: () => ordersFn(), enabled: !!user && isAdmin });
  const products = useQuery({ queryKey: ["adm-products"], queryFn: () => productsFn(), enabled: !!user && isAdmin });
  const audits = useQuery({ queryKey: ["adm-audit"], queryFn: () => auditFn(), enabled: !!user && isAdmin });
  const customers = useQuery({ queryKey: ["adm-cust"], queryFn: () => custFn(), enabled: !!user && isAdmin });
  const brands = useQuery({ queryKey: ["adm-brands"], queryFn: () => brandsFn(), enabled: !!user && isAdmin });
  const team = useQuery({ queryKey: ["adm-team"], queryFn: () => teamFn(), enabled: !!user && isAdmin });
  const reports = useQuery({ queryKey: ["adm-reports"], queryFn: () => reportsFn(), enabled: !!user && isAdmin });

  if (loading) return <AppShell><div className="p-16 text-center">…</div></AppShell>;
  if (!user || !isAdmin) {
    return <AppShell><div className="p-16 text-center text-muted-foreground">{lang === "ar" ? "هذه اللوحة للمسؤولين فقط" : "Admin only"}<div className="mt-4"><Link to="/" className="text-primary hover:underline">{t.confirm.backHome}</Link></div></div></AppShell>;
  }

  const ordersData = (orders.data ?? []) as any[];
  const productsData = (products.data ?? []) as any[];
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = ordersData.filter((o) => o.placed_at?.startsWith(today));
  const revenuePaid = ordersData.filter((o) => o.status === "paid" || o.status === "shipping" || o.status === "delivered").reduce((s, o) => s + Number(o.total_sdg), 0);
  const lowStock = productsData.filter((p) => {
    const s = Array.isArray(p.inventory) ? p.inventory[0]?.stock : p.inventory?.stock;
    return (s ?? 0) <= 5;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-elevated md:p-8">
          <h1 className="font-display text-3xl md:text-4xl">{t.panels.admin.title}</h1>
          <p className="mt-1 text-sm opacity-90">{t.panels.admin.sub}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={ShoppingBag} label={lang === "ar" ? "طلبات اليوم" : "Orders today"} value={String(todayOrders.length)} />
          <Kpi icon={BarChart3} label={lang === "ar" ? "إيرادات مدفوعة" : "Paid revenue"} value={formatPrice(revenuePaid, lang)} />
          <Kpi icon={AlertCircle} label={lang === "ar" ? "مخزون منخفض" : "Low stock"} value={String(lowStock.length)} tone="warning" />
          <Kpi icon={Users} label={lang === "ar" ? "عملاء" : "Customers"} value={String((customers.data ?? []).length)} />
        </div>

        <Tabs defaultValue="orders" className="mt-6 space-y-5">
          <TabsList className="flex flex-wrap gap-1 rounded-2xl bg-card p-1 shadow-glass">
            <Tab value="orders" icon={ShoppingBag}>{lang === "ar" ? "الطلبات" : "Orders"}</Tab>
            <Tab value="registrations" icon={UserPlus}>{lang === "ar" ? "طلبات التسجيل" : "Registrations"}</Tab>
            <Tab value="products" icon={Package}>{lang === "ar" ? "المنتجات" : "Products"}</Tab>
            <Tab value="customers" icon={Users}>{lang === "ar" ? "العملاء" : "Customers"}</Tab>
            <Tab value="catalog" icon={Tags}>{lang === "ar" ? "العلامات" : "Brands"}</Tab>
            <Tab value="team" icon={UserCog}>{lang === "ar" ? "الفريق" : "Team"}</Tab>
            <Tab value="reports" icon={BarChart3}>{lang === "ar" ? "التقارير" : "Reports"}</Tab>
            <Tab value="audit" icon={LayoutDashboard}>{lang === "ar" ? "السجل" : "Audit"}</Tab>
          </TabsList>

          <TabsContent value="registrations">
            <RegistrationRequestsPanel enabled={!!user && isAdmin} />
          </TabsContent>


          <TabsContent value="orders">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-start text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><Th>#</Th><Th>{lang === "ar" ? "العميلة" : "Customer"}</Th><Th align="end">{lang === "ar" ? "الإجمالي" : "Total"}</Th><Th align="end">{lang === "ar" ? "الحالة" : "Status"}</Th><Th align="end">{lang === "ar" ? "التاريخ" : "Date"}</Th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ordersData.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <Td><span className="font-mono">{o.number}</span></Td>
                      <Td>{o.contact_name}</Td>
                      <Td align="end">{formatPrice(Number(o.total_sdg), lang)}</Td>
                      <Td align="end"><OrderStatusBadge status={o.status} /></Td>
                      <Td align="end">{formatDate(o.placed_at, lang)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-start text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><Th>{lang === "ar" ? "المنتج" : "Product"}</Th><Th>{lang === "ar" ? "العلامة" : "Brand"}</Th><Th align="end">{lang === "ar" ? "السعر" : "Price"}</Th><Th align="end">{lang === "ar" ? "المخزون" : "Stock"}</Th><Th align="end">{lang === "ar" ? "الحالة" : "Status"}</Th><Th align="end">{lang === "ar" ? "إجراء" : "Action"}</Th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productsData.map((p) => {
                    const stock = Array.isArray(p.inventory) ? p.inventory[0]?.stock : p.inventory?.stock;
                    const toggleArchive = async () => {
                      try {
                        if (p.is_active) await softDelFn({ data: { productId: p.id } } as any);
                        else await restoreFn({ data: { productId: p.id } } as any);
                        toast.success(p.is_active ? (lang === "ar" ? "تم الأرشفة" : "Archived") : (lang === "ar" ? "تم الاستعادة" : "Restored"));
                        qc.invalidateQueries({ queryKey: ["adm-products"] });
                      } catch (e: any) { toast.error(e.message); }
                    };
                    return (
                      <tr key={p.id} className={`hover:bg-muted/30 ${p.is_active ? "" : "opacity-60"}`}>
                        <Td><div className="flex items-center gap-2.5"><img src={p.image_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-xl object-cover" /><span className="line-clamp-1">{lang === "ar" ? p.name_ar : p.name_en}</span></div></Td>
                        <Td>{lang === "ar" ? p.brand?.name_ar : p.brand?.name_en}</Td>
                        <Td align="end">{formatPrice(Number(p.price_sdg), lang)}</Td>
                        <Td align="end"><StockEditor id={p.id} stock={stock ?? 0} onSave={async (n) => { await stockFn({ data: { productId: p.id, stock: n } } as any); toast.success("OK"); qc.invalidateQueries({ queryKey: ["adm-products"] }); }} /></Td>
                        <Td align="end">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            {p.is_active ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "مؤرشف" : "Archived")}
                          </span>
                        </Td>
                        <Td align="end">
                          <div className="inline-flex items-center gap-1.5">
                            <Link to="/products/$id" params={{ id: p.slug }} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"><Pencil className="h-3 w-3" />{lang === "ar" ? "عرض" : "View"}</Link>
                            <button onClick={toggleArchive} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                              {p.is_active ? (lang === "ar" ? "أرشفة" : "Archive") : (lang === "ar" ? "استعادة" : "Restore")}
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-start text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"><tr><Th>{lang === "ar" ? "الاسم" : "Name"}</Th><Th>{lang === "ar" ? "الجوال" : "Phone"}</Th><Th align="end">{lang === "ar" ? "الطلبات" : "Orders"}</Th><Th align="end">{lang === "ar" ? "الإجمالي" : "Total"}</Th></tr></thead>
                <tbody className="divide-y divide-border">
                  {(customers.data ?? []).map((c: any) => (
                    <tr key={c.id}><Td>{c.full_name || "—"}</Td><Td><span dir="ltr">{c.phone}</span></Td><Td align="end">{c.orders_count}</Td><Td align="end">{formatPrice(c.total_spent, lang)}</Td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="catalog">
            <ul className="grid gap-2 md:grid-cols-2">
              {(brands.data ?? []).map((b: any) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                  <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand font-display text-base text-primary-foreground">{(lang === "ar" ? b.name_ar : b.name_en).slice(0, 1)}</span><span className="text-sm font-medium text-foreground">{lang === "ar" ? b.name_ar : b.name_en}</span></span>
                  <span className="text-xs text-muted-foreground">{b.slug}</span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="team">
            <div className="grid gap-4 md:grid-cols-2">
              <TeamCol title={lang === "ar" ? "مديرون" : "Admins"} members={team.data?.admins ?? []} />
              <TeamCol title={lang === "ar" ? "خدمة العملاء" : "Customer Service"} members={team.data?.staff ?? []} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{lang === "ar" ? "لمنح الأدوار، استخدمي قاعدة البيانات مباشرة في هذه المرحلة." : "Role grants are performed via the database for now."}</p>
          </TabsContent>

          <TabsContent value="reports">
            {reports.isLoading ? (
              <p className="p-8 text-center text-sm text-muted-foreground">…</p>
            ) : reports.data ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Kpi icon={BarChart3} label={lang === "ar" ? "إيرادات ٣٠ يوم" : "Revenue 30d"} value={formatPrice(reports.data.revenue30d, lang)} />
                  <Kpi icon={ShoppingBag} label={lang === "ar" ? "طلبات ٣٠ يوم" : "Orders 30d"} value={String(reports.data.orders30d)} />
                  <Kpi icon={Package} label={lang === "ar" ? "منتجات نشطة" : "Active products"} value={String(reports.data.activeProducts)} />
                  <Kpi icon={AlertCircle} label={lang === "ar" ? "مؤرشفة" : "Archived"} value={String(reports.data.archivedProducts)} tone="warning" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <h4 className="mb-2 font-display text-sm text-foreground">{lang === "ar" ? "حالات الطلبات" : "Orders by status"}</h4>
                    <ul className="space-y-1.5 text-xs">
                      {Object.entries(reports.data.byStatus).map(([s, n]) => (
                        <li key={s} className="flex justify-between"><span className="text-muted-foreground">{s}</span><span className="font-medium text-foreground">{n as number}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <h4 className="mb-2 font-display text-sm text-foreground">{lang === "ar" ? "مخزون منخفض" : "Low stock (≤3)"}</h4>
                    <ul className="space-y-1.5 text-xs">
                      {reports.data.lowStock.length === 0 ? <li className="text-muted-foreground">—</li> : reports.data.lowStock.map((r: any) => (
                        <li key={r.product_id} className="flex justify-between">
                          <span className="line-clamp-1 text-foreground">{lang === "ar" ? r.product?.name_ar : r.product?.name_en}</span>
                          <span className={`font-mono ${r.stock === 0 ? "text-destructive" : "text-warning-foreground"}`}>{r.stock}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="audit">
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {(audits.data ?? []).map((a: any) => (
                <li key={a.id} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 p-3 text-xs">
                  <span className="font-mono text-muted-foreground">{formatDate(a.at, lang)}</span>
                  <span className="text-foreground">{a.action} · {a.entity_type}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{a.entity_id}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "warning" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-glass">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone === "warning" ? "bg-warning/15 text-warning-foreground" : "gradient-brand text-primary-foreground"}`}><Icon className="h-4 w-4" /></div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl text-foreground">{value}</p>
    </div>
  );
}
function Tab({ value, icon: Icon, children }: { value: string; icon: any; children: React.ReactNode }) {
  return <TabsTrigger value={value} className="gap-1.5 rounded-xl px-3 py-2 text-xs data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"><Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{children}</span></TabsTrigger>;
}
function Th({ children, align }: { children: React.ReactNode; align?: "start" | "end" }) { return <th className={`p-3 text-${align ?? "start"} font-medium`}>{children}</th>; }
function Td({ children, align }: { children: React.ReactNode; align?: "start" | "end" }) { return <td className={`p-3 text-${align ?? "start"}`}>{children}</td>; }
function TeamCol({ title, members }: { title: string; members: any[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="mb-2 font-display text-sm text-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {members.length === 0 ? <li className="text-xs text-muted-foreground">—</li> : members.map((m) => (
          <li key={m.id} className="text-xs text-foreground">{m.full_name || m.phone}</li>
        ))}
      </ul>
    </div>
  );
}
function StockEditor({ id, stock, onSave }: { id: string; stock: number; onSave: (n: number) => Promise<void> }) {
  const [v, setV] = useState(stock);
  return (
    <span className="inline-flex items-center gap-1">
      <input type="number" min={0} value={v} onChange={(e) => setV(Number(e.target.value))} className="h-7 w-16 rounded border border-input bg-background px-2 text-xs" />
      <button onClick={() => onSave(v)} className="rounded-full bg-primary px-2 py-1 text-[10px] text-primary-foreground">{stock === v ? "—" : "Save"}</button>
    </span>
  );
}

// Re-export for staff.tsx if anything still imports it (legacy)
export function PanelShell({ title, sub, children }: { title: string; sub: string; accent?: string; children: React.ReactNode }) {
  return <AppShell><div className="mx-auto max-w-7xl px-4 py-8 md:py-10"><div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-elevated md:p-8"><h1 className="font-display text-3xl md:text-4xl">{title}</h1><p className="mt-1 text-sm opacity-90">{sub}</p></div>{children}</div></AppShell>;
}
