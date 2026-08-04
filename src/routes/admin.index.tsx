// Overview center — is anything wrong right now?
import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, BarChart3, AlertCircle, Users } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { CenterHeader, Kpi, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import {
  useAdminOrders, useAdminProducts, useAdminCustomers,
  useAdminPendingRequests, stockOf, LOW_STOCK_THRESHOLD,
} from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "نظرة عامة — إدارة ميتاكير" },
      { name: "description", content: "مؤشرات الأداء اليومية وتنبيهات المخزون والطلبات الأخيرة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;

  const ordersQ = useAdminOrders(enabled);
  const productsQ = useAdminProducts(enabled);
  const customersQ = useAdminCustomers(enabled);
  const requestsQ = useAdminPendingRequests(enabled);

  const orders = (ordersQ.data ?? []) as any[];
  const products = (productsQ.data ?? []) as any[];
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.placed_at?.startsWith(today));
  const revenuePaid = orders
    .filter((o) => ["paid", "shipping", "delivered"].includes(o.status))
    .reduce((s, o) => s + Number(o.total_sdg), 0);
  const lowStock = products.filter((p) => p.is_active && stockOf(p) <= LOW_STOCK_THRESHOLD);
  const pending = ((requestsQ.data ?? []) as any[]).length;

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "نظرة عامة" : "Overview"}
        sub={lang === "ar" ? "حالة العمل اليوم في لمحة واحدة." : "Today's state of the business at a glance."}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={ShoppingBag} label={lang === "ar" ? "طلبات اليوم" : "Orders today"} value={String(todayOrders.length)} />
        <Kpi icon={BarChart3} label={lang === "ar" ? "إيرادات مدفوعة" : "Paid revenue"} value={formatPrice(revenuePaid, lang)} />
        <Kpi icon={AlertCircle} label={lang === "ar" ? "مخزون منخفض" : "Low stock"} value={String(lowStock.length)} tone="warning" />
        <Kpi icon={Users} label={lang === "ar" ? "عملاء" : "Customers"} value={String(((customersQ.data ?? []) as any[]).length)} />
      </div>

      {(lowStock.length > 0 || pending > 0) && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {lowStock.length > 0 && (
            <Link to="/admin/inventory" className="rounded-2xl border border-warning/40 bg-warning/10 p-4 transition hover:bg-warning/15">
              <p className="text-sm font-medium text-foreground">
                {lang === "ar" ? `${lowStock.length} منتج بحاجة لإعادة تعبئة` : `${lowStock.length} products need restocking`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{lang === "ar" ? "افتحي مركز المخزون" : "Open the inventory center"}</p>
            </Link>
          )}
          {pending > 0 && (
            <Link to="/admin/registrations" className="rounded-2xl border border-primary/40 bg-primary/10 p-4 transition hover:bg-primary/15">
              <p className="text-sm font-medium text-foreground">
                {lang === "ar" ? `${pending} طلب تسجيل بانتظار المراجعة` : `${pending} registration requests awaiting review`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{lang === "ar" ? "افتحي مركز طلبات التسجيل" : "Open the registrations center"}</p>
            </Link>
          )}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-display text-lg text-foreground">
        {lang === "ar" ? "أحدث الطلبات" : "Latest orders"}
      </h2>
      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>#</Th>
            <Th>{lang === "ar" ? "العميلة" : "Customer"}</Th>
            <Th align="end">{lang === "ar" ? "الإجمالي" : "Total"}</Th>
            <Th align="end">{lang === "ar" ? "الحالة" : "Status"}</Th>
            <Th align="end">{lang === "ar" ? "التاريخ" : "Date"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.length === 0 ? (
            <EmptyRow colSpan={5} label={lang === "ar" ? "لا توجد طلبات بعد" : "No orders yet"} />
          ) : orders.slice(0, 8).map((o) => (
            <tr key={o.id} className="hover:bg-muted/30">
              <Td><span className="font-mono">{o.number}</span></Td>
              <Td>{o.contact_name}</Td>
              <Td align="end">{formatPrice(Number(o.total_sdg), lang)}</Td>
              <Td align="end"><OrderStatusBadge status={o.status} /></Td>
              <Td align="end">{formatDate(o.placed_at, lang)}</Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </>
  );
}
