// Catalogue center — products, brands, archive / restore.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { adminSoftDeleteProduct, adminRestoreProduct } from "@/lib/api/admin.functions";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminProducts, useAdminBrands } from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin/catalog")({
  head: () => ({
    meta: [
      { title: "الكتالوج — إدارة ميتاكير" },
      { name: "description", content: "إدارة المنتجات والعلامات التجارية مع الأرشفة والاستعادة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCatalog,
});

function AdminCatalog() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(true);

  const productsQ = useAdminProducts(enabled);
  const brandsQ = useAdminBrands(enabled);
  const softDelFn = useServerFn(adminSoftDeleteProduct);
  const restoreFn = useServerFn(adminRestoreProduct);

  const all = (productsQ.data ?? []) as any[];
  const products = showArchived ? all : all.filter((p) => p.is_active);

  const toggleArchive = async (p: any) => {
    try {
      if (p.is_active) await softDelFn({ data: { productId: p.id } } as any);
      else await restoreFn({ data: { productId: p.id } } as any);
      toast.success(p.is_active ? (lang === "ar" ? "تمت الأرشفة" : "Archived") : (lang === "ar" ? "تمت الاستعادة" : "Restored"));
      qc.invalidateQueries({ queryKey: ["adm-products"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "الكتالوج" : "Catalogue"}
        sub={lang === "ar" ? "المنتجات والعلامات التجارية المعروضة في المتجر." : "The products and brands presented in the store."}
      />

      <label className="mb-4 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-3.5 w-3.5 rounded border-input" />
        {lang === "ar" ? "إظهار المنتجات المؤرشفة" : "Show archived products"}
      </label>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{lang === "ar" ? "المنتج" : "Product"}</Th>
            <Th>{lang === "ar" ? "العلامة" : "Brand"}</Th>
            <Th align="end">{lang === "ar" ? "السعر" : "Price"}</Th>
            <Th align="end">{lang === "ar" ? "الحالة" : "Status"}</Th>
            <Th align="end">{lang === "ar" ? "إجراء" : "Action"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.length === 0 ? (
            <EmptyRow colSpan={5} label={lang === "ar" ? "لا توجد منتجات" : "No products"} />
          ) : products.map((p) => (
            <tr key={p.id} className={`hover:bg-muted/30 ${p.is_active ? "" : "opacity-60"}`}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <img src={p.image_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  <span className="line-clamp-1">{lang === "ar" ? p.name_ar : p.name_en}</span>
                </div>
              </Td>
              <Td>{lang === "ar" ? p.brand?.name_ar : p.brand?.name_en}</Td>
              <Td align="end">{formatPrice(Number(p.price_sdg), lang)}</Td>
              <Td align="end">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {p.is_active ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "مؤرشف" : "Archived")}
                </span>
              </Td>
              <Td align="end">
                <div className="inline-flex items-center gap-1.5">
                  <Link to="/products/$id" params={{ id: p.slug }} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                    <Pencil className="h-3 w-3" />{lang === "ar" ? "عرض" : "View"}
                  </Link>
                  <button onClick={() => toggleArchive(p)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                    {p.is_active ? (lang === "ar" ? "أرشفة" : "Archive") : (lang === "ar" ? "استعادة" : "Restore")}
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <h2 className="mb-3 mt-8 font-display text-lg text-foreground">{lang === "ar" ? "العلامات التجارية" : "Brands"}</h2>
      <ul className="grid gap-2 md:grid-cols-2">
        {((brandsQ.data ?? []) as any[]).map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand font-display text-base text-primary-foreground">
                {(lang === "ar" ? b.name_ar : b.name_en).slice(0, 1)}
              </span>
              <span className="text-sm font-medium text-foreground">{lang === "ar" ? b.name_ar : b.name_en}</span>
            </span>
            <span className="text-xs text-muted-foreground">{b.slug}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
