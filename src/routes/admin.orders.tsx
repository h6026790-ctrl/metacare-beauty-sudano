// Orders center — full order ledger for the administrator.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminOrders } from "@/components/admin/useAdminWorkspace";

const STATUSES = ["all", "new", "review", "paid", "shipping", "delivered", "cancelled", "returned"] as const;

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات — إدارة ميتاكير" },
      { name: "description", content: "سجل كامل لكل الطلبات مع الحالات والإجماليات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState<string>("all");
  const ordersQ = useAdminOrders(!!user && isAdmin);

  const all = (ordersQ.data ?? []) as any[];
  const rows = status === "all" ? all : all.filter((o) => o.status === status);

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "الطلبات" : "Orders"}
        sub={lang === "ar" ? "كل الطلبات عبر دورة حياتها الكاملة." : "Every order across its full lifecycle."}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              status === s ? "border-transparent gradient-brand text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s === "all" ? (lang === "ar" ? "الكل" : "All") : s}
          </button>
        ))}
      </div>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>#</Th>
            <Th>{lang === "ar" ? "العميلة" : "Customer"}</Th>
            <Th>{lang === "ar" ? "الجوال" : "Phone"}</Th>
            <Th align="end">{lang === "ar" ? "الإجمالي" : "Total"}</Th>
            <Th align="end">{lang === "ar" ? "الحالة" : "Status"}</Th>
            <Th align="end">{lang === "ar" ? "التاريخ" : "Date"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} label={lang === "ar" ? "لا توجد طلبات في هذه الحالة" : "No orders in this state"} />
          ) : rows.map((o) => (
            <tr key={o.id} className="hover:bg-muted/30">
              <Td><span className="font-mono">{o.number}</span></Td>
              <Td>{o.contact_name}</Td>
              <Td><span dir="ltr" className="font-mono text-xs">{o.contact_phone}</span></Td>
              <Td align="end">{formatPrice(Number(o.total_sdg), lang)}</Td>
              <Td align="end"><OrderStatusBadge status={o.status} /></Td>
              <Td align="end">{formatDate(o.placed_at, lang)}</Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <p className="mt-3 text-xs text-muted-foreground">
        {lang === "ar"
          ? "تغيير حالات الطلبات يتم من مكتب خدمة العملاء."
          : "Order status transitions are performed from the Customer Service desk."}
      </p>
    </>
  );
}
