// Inventory center — stock levels and adjustments, low stock first.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { adminAdjustStock } from "@/lib/api/ops.functions";
import { CenterHeader, TableCard, Th, Td, EmptyRow, StockEditor } from "@/components/admin/ui";
import { useAdminProducts, stockOf, LOW_STOCK_THRESHOLD } from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin/inventory/")({
  head: () => ({
    meta: [
      { title: "المخزون — إدارة ميتاكير" },
      { name: "description", content: "مستويات المخزون وتعديل الكميات مع إبراز المنتجات المنخفضة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminInventory,
});

function AdminInventory() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;
  const qc = useQueryClient();
  const [lowOnly, setLowOnly] = useState(false);

  const productsQ = useAdminProducts(enabled);
  const stockFn = useServerFn(adminAdjustStock);

  const all = ((productsQ.data ?? []) as any[]).filter((p) => p.is_active);
  const sorted = [...all].sort((a, b) => stockOf(a) - stockOf(b));
  const rows = lowOnly ? sorted.filter((p) => stockOf(p) <= LOW_STOCK_THRESHOLD) : sorted;

  const save = async (p: any, n: number) => {
    try {
      await stockFn({ data: { productId: p.id, stock: n } } as any);
      toast.success(lang === "ar" ? "تم تحديث المخزون" : "Stock updated");
      qc.invalidateQueries({ queryKey: ["adm-products"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "المخزون" : "Inventory"}
        sub={lang === "ar" ? "الكميات المتاحة مرتبة من الأقل إلى الأعلى." : "Available quantities, lowest first."}
      />

      <label className="mb-4 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="h-3.5 w-3.5 rounded border-input" />
        {lang === "ar" ? `عرض المخزون المنخفض فقط (≤ ${LOW_STOCK_THRESHOLD})` : `Low stock only (≤ ${LOW_STOCK_THRESHOLD})`}
      </label>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{lang === "ar" ? "المنتج" : "Product"}</Th>
            <Th>{lang === "ar" ? "العلامة" : "Brand"}</Th>
            <Th align="end">{lang === "ar" ? "المتوفر" : "In stock"}</Th>
            <Th align="end">{lang === "ar" ? "تعديل" : "Adjust"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow colSpan={4} label={lang === "ar" ? "لا توجد منتجات" : "No products"} />
          ) : rows.map((p) => {
            const stock = stockOf(p);
            const low = stock <= LOW_STOCK_THRESHOLD;
            return (
              <tr key={p.id} className="hover:bg-muted/30">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <img src={p.image_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    <span className="line-clamp-1">{lang === "ar" ? p.name_ar : p.name_en}</span>
                  </div>
                </Td>
                <Td>{lang === "ar" ? p.brand?.name_ar : p.brand?.name_en}</Td>
                <Td align="end">
                  <span className={`font-mono ${stock === 0 ? "text-destructive" : low ? "text-warning-foreground" : "text-foreground"}`}>{stock}</span>
                </Td>
                <Td align="end"><StockEditor stock={stock} onSave={(n) => save(p, n)} /></Td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>
    </>
  );
}
