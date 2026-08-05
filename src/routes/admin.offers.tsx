// Promotions center — Pick of the Day and the featured offers shown in the store.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { adminSetPickOfDay, adminSetProductFlags } from "@/lib/api/admin.functions";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminProducts } from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin/offers")({
  head: () => ({
    meta: [
      { title: "العروض ومنتج اليوم — إدارة ميتاكير" },
      { name: "description", content: "إدارة منتج اليوم والعروض المميزة الظاهرة في واجهة المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOffers,
});

function AdminOffers() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;
  const qc = useQueryClient();

  const productsQ = useAdminProducts(enabled);
  const setPickFn = useServerFn(adminSetPickOfDay);
  const setFlagsFn = useServerFn(adminSetProductFlags);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const all = ((productsQ.data ?? []) as any[]).filter((p) => p.is_active);
  const pick = all.find((p) => p.is_pick_of_day) ?? null;
  const term = search.trim().toLowerCase();
  const listed = term
    ? all.filter((p) => `${p.name_ar} ${p.name_en} ${p.slug}`.toLowerCase().includes(term))
    : all;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adm-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const setPick = async (productId: string | null) => {
    setBusy(productId ?? "clear");
    try {
      await setPickFn({ data: { productId } } as any);
      toast.success(productId ? (ar ? "تم تعيين منتج اليوم" : "Pick of the Day set") : (ar ? "تم إلغاء منتج اليوم" : "Pick of the Day cleared"));
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? (ar ? "تعذر التنفيذ" : "Could not update"));
    } finally {
      setBusy(null);
    }
  };

  const toggleFlag = async (p: any, key: "is_featured" | "is_new" | "is_best_seller" | "is_on_sale") => {
    setBusy(p.id + key);
    try {
      await setFlagsFn({ data: { productId: p.id, [key]: !p[key] } } as any);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? (ar ? "تعذر التنفيذ" : "Could not update"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <CenterHeader
        title={ar ? "العروض ومنتج اليوم" : "Offers & Pick of the Day"}
        sub={ar ? "اختاري ما يظهر في واجهة المتجر من عروض ومنتجات مميزة." : "Choose what the storefront highlights right now."}
      />

      <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-glass">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />{ar ? "منتج اليوم" : "Pick of the Day"}
        </h2>
        {pick ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <img src={pick.image_url || "/placeholder.svg"} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            <div className="min-w-0">
              <p className="font-display text-base text-foreground">{ar ? pick.name_ar : pick.name_en}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(Number(pick.price_sdg), lang)}</p>
            </div>
            <button
              onClick={() => setPick(null)}
              disabled={busy !== null}
              className="ms-auto rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {ar ? "إلغاء التعيين" : "Clear"}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {ar ? "لم يتم اختيار منتج اليوم بعد — اختاري منتجاً من القائمة أدناه." : "No pick selected yet — choose a product from the list below."}
          </p>
        )}
      </section>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg text-foreground">{ar ? "المنتجات المميزة" : "Featured products"}</h2>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={ar ? "بحث…" : "Search…"}
          className="h-9 w-52 rounded-full border border-input bg-background px-4 text-sm"
        />
      </div>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{ar ? "المنتج" : "Product"}</Th>
            <Th align="end">{ar ? "مميّز" : "Featured"}</Th>
            <Th align="end">{ar ? "جديد" : "New"}</Th>
            <Th align="end">{ar ? "الأكثر مبيعاً" : "Best seller"}</Th>
            <Th align="end">{ar ? "عرض" : "On sale"}</Th>
            <Th align="end">{ar ? "منتج اليوم" : "Pick of the Day"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {listed.length === 0 ? (
            <EmptyRow colSpan={6} label={ar ? "لا توجد منتجات" : "No products"} />
          ) : listed.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30">
              <Td>
                <div className="flex items-center gap-2.5">
                  <img src={p.image_url || "/placeholder.svg"} alt="" className="h-9 w-9 rounded-xl object-cover" />
                  <span className="line-clamp-1">{ar ? p.name_ar : p.name_en}</span>
                </div>
              </Td>
              {(["is_featured", "is_new", "is_best_seller", "is_on_sale"] as const).map((key) => (
                <Td key={key} align="end">
                  <button
                    onClick={() => toggleFlag(p, key)}
                    disabled={busy !== null}
                    aria-pressed={!!p[key]}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                      p[key] ? "gradient-brand text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p[key] ? (ar ? "مفعّل" : "On") : (ar ? "متوقف" : "Off")}
                  </button>
                </Td>
              ))}
              <Td align="end">
                <button
                  onClick={() => setPick(p.is_pick_of_day ? null : p.id)}
                  disabled={busy !== null}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                    p.is_pick_of_day ? "gradient-brand text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Star className="h-3 w-3" />
                  {p.is_pick_of_day ? (ar ? "منتج اليوم" : "Selected") : (ar ? "اختيار" : "Select")}
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </>
  );
}
