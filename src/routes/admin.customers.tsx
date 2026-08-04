// Customers center — the customer directory.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminCustomers } from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({
    meta: [
      { title: "العملاء — إدارة ميتاكير" },
      { name: "description", content: "دليل العميلات مع عدد الطلبات وإجمالي الإنفاق." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const customersQ = useAdminCustomers(!!user && isAdmin);

  const term = q.trim().toLowerCase();
  const rows = ((customersQ.data ?? []) as any[]).filter(
    (c) => !term || String(c.full_name ?? "").toLowerCase().includes(term) || String(c.phone ?? "").includes(term),
  );

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "العملاء" : "Customers"}
        sub={lang === "ar" ? "كل العميلات المسجلات ونشاطهن الشرائي." : "Every registered customer and their purchase activity."}
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={lang === "ar" ? "بحث بالاسم أو الجوال" : "Search by name or phone"}
        className="mb-4 h-10 w-full max-w-sm rounded-xl border border-input bg-background px-3 text-sm"
      />

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{lang === "ar" ? "الاسم" : "Name"}</Th>
            <Th>{lang === "ar" ? "الجوال" : "Phone"}</Th>
            <Th align="end">{lang === "ar" ? "الطلبات" : "Orders"}</Th>
            <Th align="end">{lang === "ar" ? "الإجمالي" : "Total"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow colSpan={4} label={lang === "ar" ? "لا توجد نتائج" : "No results"} />
          ) : rows.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <Td>{c.full_name || "—"}</Td>
              <Td><span dir="ltr" className="font-mono text-xs">{c.phone}</span></Td>
              <Td align="end">{c.orders_count}</Td>
              <Td align="end">{formatPrice(c.total_spent, lang)}</Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </>
  );
}
