// Inventory movement history — every stock change with its source
// (purchase invoice, order reservation, restore, manual adjustment…)
// and a reference back to the originating document.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminProducts } from "@/components/admin/useAdminWorkspace";
import { adminListInventoryMovements } from "@/lib/api/purchasing.functions";

export const Route = createFileRoute("/admin/inventory/movements")({
  head: () => ({
    meta: [
      { title: "حركة المخزون — إدارة ميتاكير" },
      { name: "description", content: "سجل كامل لكل زيادة أو نقص في المخزون مع مصدر الحركة ومرجعها." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMovements,
});

const SOURCES: Record<string, { ar: string; en: string }> = {
  purchase_invoice: { ar: "فاتورة شراء", en: "Purchase invoice" },
  order_reservation: { ar: "حجز طلب عميل", en: "Order reservation" },
  order_restore: { ar: "إرجاع/إلغاء طلب", en: "Order restore" },
  transfer: { ar: "تحويل مخزني", en: "Warehouse transfer" },
  adjustment: { ar: "تعديل يدوي", en: "Manual adjustment" },
};

function AdminMovements() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;

  const [productId, setProductId] = useState("");
  const [source, setSource] = useState("");

  const fn = useServerFn(adminListInventoryMovements);
  const q = useQuery({
    queryKey: ["adm-movements", productId, source],
    queryFn: () => fn({ data: { productId: productId || null, source: source || null, limit: 300 } } as any),
    enabled,
  });
  const productsQ = useAdminProducts(enabled);
  const products = (productsQ.data ?? []) as any[];
  const rows = (q.data ?? []) as any[];

  return (
    <>
      <CenterHeader
        title={ar ? "حركة المخزون" : "Inventory movements"}
        sub={ar ? "كل تغيير في الكميات موثق بمصدره ومرجعه، من الشراء حتى البيع." : "Every quantity change, documented with its source and reference."}
      />

      <div className="mb-4 grid gap-2 md:grid-cols-2">
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{ar ? "كل المنتجات" : "All products"}</option>
          {products.map((p) => <option key={p.id} value={p.id}>{ar ? p.name_ar : p.name_en}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{ar ? "كل المصادر" : "All sources"}</option>
          {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{ar ? v.ar : v.en}</option>)}
        </select>
      </div>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{ar ? "التاريخ" : "Date"}</Th>
            <Th>{ar ? "المنتج" : "Product"}</Th>
            <Th>{ar ? "المصدر" : "Source"}</Th>
            <Th>{ar ? "المرجع" : "Reference"}</Th>
            <Th align="end">{ar ? "التغيير" : "Change"}</Th>
            <Th align="end">{ar ? "الرصيد بعدها" : "Balance"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} label={ar ? "لا توجد حركات" : "No movements"} />
          ) : rows.map((m) => {
            const src = SOURCES[m.source] ?? { ar: m.source, en: m.source };
            return (
              <tr key={m.id} className="hover:bg-muted/30">
                <Td><span className="font-mono text-xs">{new Date(m.created_at).toLocaleString(ar ? "ar" : "en")}</span></Td>
                <Td>{ar ? m.product?.name_ar : m.product?.name_en}</Td>
                <Td>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px]">{ar ? src.ar : src.en}</span>
                </Td>
                <Td>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {m.invoice ? `${m.invoice.invoice_number} — ${m.invoice.supplier_name}` : m.reference_id ? `${m.reference_type}:${String(m.reference_id).slice(0, 8)}` : "—"}
                  </span>
                </Td>
                <Td align="end">
                  <span className={`font-mono ${m.delta > 0 ? "text-success" : "text-destructive"}`}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </span>
                </Td>
                <Td align="end"><span className="font-mono">{m.balance_after}</span></Td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>
    </>
  );
}
