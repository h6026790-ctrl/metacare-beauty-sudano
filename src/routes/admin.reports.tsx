// Reports center — 30-day performance.
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, ShoppingBag, Package, AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { CenterHeader, Kpi } from "@/components/admin/ui";
import { useAdminReports } from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — إدارة ميتاكير" },
      { name: "description", content: "مؤشرات الثلاثين يوماً الماضية وتوزيع حالات الطلبات والمخزون المنخفض." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const reportsQ = useAdminReports(!!user && isAdmin);
  const data = reportsQ.data as any;

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "التقارير" : "Reports"}
        sub={lang === "ar" ? "أداء آخر ثلاثين يوماً." : "Performance over the last thirty days."}
      />

      {reportsQ.isLoading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">…</p>
      ) : !data ? (
        <p className="p-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد بيانات" : "No data"}</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={BarChart3} label={lang === "ar" ? "إيرادات ٣٠ يوم" : "Revenue 30d"} value={formatPrice(data.revenue30d, lang)} />
            <Kpi icon={ShoppingBag} label={lang === "ar" ? "طلبات ٣٠ يوم" : "Orders 30d"} value={String(data.orders30d)} />
            <Kpi icon={Package} label={lang === "ar" ? "منتجات نشطة" : "Active products"} value={String(data.activeProducts)} />
            <Kpi icon={AlertCircle} label={lang === "ar" ? "مؤرشفة" : "Archived"} value={String(data.archivedProducts)} tone="warning" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-2 font-display text-sm text-foreground">{lang === "ar" ? "حالات الطلبات" : "Orders by status"}</h2>
              <ul className="space-y-1.5 text-xs">
                {Object.entries(data.byStatus ?? {}).map(([s, n]) => (
                  <li key={s} className="flex justify-between">
                    <span className="text-muted-foreground">{s}</span>
                    <span className="font-medium text-foreground">{n as number}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-2 font-display text-sm text-foreground">{lang === "ar" ? "مخزون منخفض (≤٣)" : "Low stock (≤3)"}</h2>
              <ul className="space-y-1.5 text-xs">
                {(data.lowStock ?? []).length === 0 ? (
                  <li className="text-muted-foreground">—</li>
                ) : data.lowStock.map((r: any) => (
                  <li key={r.product_id} className="flex justify-between">
                    <span className="line-clamp-1 text-foreground">{lang === "ar" ? r.product?.name_ar : r.product?.name_en}</span>
                    <span className={`font-mono ${r.stock === 0 ? "text-destructive" : "text-warning-foreground"}`}>{r.stock}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
