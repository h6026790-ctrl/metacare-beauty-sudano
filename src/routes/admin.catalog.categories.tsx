// Category administration — create, edit, archive/restore, reorder,
// image upload, product counts, and moving products between categories.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Shuffle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminProducts } from "@/components/admin/useAdminWorkspace";
import { adminUploadProductImage } from "@/lib/api/admin.functions";
import {
  adminListCategoriesFull, adminSaveCategory, adminSetCategoryActive,
  adminReorderCategories, adminMoveProductsToCategory,
} from "@/lib/api/catalog-admin.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/catalog/categories")({
  head: () => ({
    meta: [
      { title: "التصنيفات — إدارة ميتاكير" },
      { name: "description", content: "إنشاء وتعديل وأرشفة تصنيفات المنتجات وترتيب عرضها ونقل المنتجات بينها." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCategories,
});

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

type CatForm = {
  id?: string;
  slug: string; name_ar: string; name_en: string;
  description_ar: string; description_en: string;
  icon: string; image_url: string; sort_order: string; is_active: boolean;
};

const EMPTY: CatForm = {
  slug: "", name_ar: "", name_en: "", description_ar: "", description_en: "",
  icon: "", image_url: "", sort_order: "0", is_active: true,
};

function AdminCategories() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;
  const qc = useQueryClient();

  const listFn = useServerFn(adminListCategoriesFull);
  const saveFn = useServerFn(adminSaveCategory);
  const activeFn = useServerFn(adminSetCategoryActive);
  const reorderFn = useServerFn(adminReorderCategories);
  const moveFn = useServerFn(adminMoveProductsToCategory);
  const uploadFn = useServerFn(adminUploadProductImage);

  const catsQ = useQuery({ queryKey: ["adm-categories-full"], queryFn: () => listFn(), enabled });
  const productsQ = useAdminProducts(enabled);

  const [form, setForm] = useState<CatForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [moveFrom, setMoveFrom] = useState<any | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [picked, setPicked] = useState<string[]>([]);

  const cats = ((catsQ.data as any)?.categories ?? []) as any[];
  const uncategorised = ((catsQ.data as any)?.uncategorised ?? 0) as number;
  const products = (productsQ.data ?? []) as any[];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adm-categories-full"] });
    qc.invalidateQueries({ queryKey: ["adm-categories"] });
    qc.invalidateQueries({ queryKey: ["adm-products"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = () => reject(new Error("read_failed"));
        r.readAsDataURL(file);
      });
      const res: any = await uploadFn({ data: { fileName: file.name, contentType: file.type, base64 } } as any);
      setForm((f) => (f ? { ...f, image_url: res.url } : f));
      toast.success(ar ? "تم رفع الصورة" : "Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? (ar ? "تعذر رفع الصورة" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveFn({
        data: {
          ...(form.id ? { id: form.id } : {}),
          slug: form.slug.trim() || slugify(form.name_en || form.name_ar),
          name_ar: form.name_ar.trim(), name_en: form.name_en.trim(),
          description_ar: form.description_ar.trim() || null,
          description_en: form.description_en.trim() || null,
          icon: form.icon.trim() || null,
          image_url: form.image_url.trim() || null,
          sort_order: Number(form.sort_order) || 0,
          is_active: form.is_active,
        },
      } as any);
      toast.success(ar ? "تم حفظ التصنيف" : "Category saved");
      setForm(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر الحفظ" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: any) => {
    try {
      await activeFn({ data: { categoryId: c.id, active: !c.is_active } } as any);
      toast.success(c.is_active ? (ar ? "تمت الأرشفة" : "Archived") : (ar ? "تمت الاستعادة" : "Restored"));
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...cats];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    try {
      await reorderFn({ data: { order: next.map((c, i) => ({ id: c.id, sort_order: i })) } } as any);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const doMove = async () => {
    if (!picked.length) return;
    try {
      await moveFn({ data: { productIds: picked, categoryId: moveTarget || null } } as any);
      toast.success(ar ? "تم نقل المنتجات" : "Products moved");
      setMoveFrom(null); setPicked([]); setMoveTarget("");
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const sourceProducts = moveFrom
    ? products.filter((p) => (moveFrom.id === "__none" ? !p.category_id : p.category_id === moveFrom.id))
    : [];

  return (
    <>
      <CenterHeader
        title={ar ? "التصنيفات" : "Categories"}
        sub={ar ? "التصنيفات تُدار بالكامل من هنا: الإنشاء والتعديل والترتيب والأرشفة ونقل المنتجات." : "Create, edit, reorder, archive and move products between categories."}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {ar ? `منتجات بلا تصنيف: ${uncategorised}` : `Uncategorised products: ${uncategorised}`}
          {uncategorised > 0 && (
            <button
              onClick={() => { setMoveFrom({ id: "__none", name_ar: "بلا تصنيف", name_en: "Uncategorised" }); setPicked([]); }}
              className="ms-2 rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-muted"
            >
              {ar ? "تعيين تصنيف" : "Assign category"}
            </button>
          )}
        </p>
        <button
          onClick={() => setForm({ ...EMPTY, sort_order: String(cats.length) })}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full gradient-brand px-4 text-xs font-medium text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" />{ar ? "تصنيف جديد" : "New category"}
        </button>
      </div>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{ar ? "التصنيف" : "Category"}</Th>
            <Th>{ar ? "المعرّف" : "Slug"}</Th>
            <Th align="end">{ar ? "عدد المنتجات" : "Products"}</Th>
            <Th align="end">{ar ? "الحالة" : "Status"}</Th>
            <Th align="end">{ar ? "الترتيب" : "Order"}</Th>
            <Th align="end">{ar ? "إجراء" : "Action"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cats.length === 0 ? (
            <EmptyRow colSpan={6} label={ar ? "لا توجد تصنيفات" : "No categories"} />
          ) : cats.map((c, i) => (
            <tr key={c.id} className={`hover:bg-muted/30 ${c.is_active ? "" : "opacity-60"}`}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <img src={c.image_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  <span className="line-clamp-1">{ar ? c.name_ar : c.name_en}</span>
                </div>
              </Td>
              <Td><span className="font-mono text-xs text-muted-foreground">{c.slug}</span></Td>
              <Td align="end">
                <span className="font-mono">{c.active_product_count}</span>
                <span className="text-xs text-muted-foreground"> / {c.product_count}</span>
              </Td>
              <Td align="end">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${c.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {c.is_active ? (ar ? "نشط" : "Active") : (ar ? "مؤرشف" : "Archived")}
                </span>
              </Td>
              <Td align="end">
                <span className="inline-flex items-center gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-full border border-border p-1 disabled:opacity-30 hover:bg-muted">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="rounded-full border border-border p-1 disabled:opacity-30 hover:bg-muted">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </span>
              </Td>
              <Td align="end">
                <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                  <button
                    onClick={() => setForm({
                      id: c.id, slug: c.slug, name_ar: c.name_ar ?? "", name_en: c.name_en ?? "",
                      description_ar: c.description_ar ?? "", description_en: c.description_en ?? "",
                      icon: c.icon ?? "", image_url: c.image_url ?? "",
                      sort_order: String(c.sort_order ?? 0), is_active: !!c.is_active,
                    })}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" />{ar ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => { setMoveFrom(c); setPicked([]); }}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    <Shuffle className="h-3 w-3" />{ar ? "نقل المنتجات" : "Move products"}
                  </button>
                  <button onClick={() => toggleActive(c)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                    {c.is_active ? (ar ? "أرشفة" : "Archive") : (ar ? "استعادة" : "Restore")}
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      {/* Category form */}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? (ar ? "تعديل التصنيف" : "Edit category") : (ar ? "تصنيف جديد" : "New category")}</DialogTitle>
          </DialogHeader>
          {form && (
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{ar ? "الاسم بالعربية" : "Name (Arabic)"}</Label>
                  <Input required value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{ar ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
                  <Input required dir="ltr" value={form.name_en}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{ar ? "المعرّف (slug)" : "Slug"}</Label>
                  <Input readOnly={!!form.id} dir="ltr" value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                    className={form.id ? "bg-muted text-muted-foreground" : ""} />
                </div>
                <div className="space-y-1.5">
                  <Label>{ar ? "ترتيب العرض" : "Display order"}</Label>
                  <Input type="number" min={0} dir="ltr" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>{ar ? "صورة التصنيف" : "Category image"}</Label>
                  <Input dir="ltr" placeholder="https://…" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  <input
                    type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
                    className="block w-full text-xs text-muted-foreground file:me-3 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-xs file:font-medium"
                  />
                  {form.image_url && <img src={form.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>{ar ? "وصف مختصر (عربي)" : "Short description (Arabic)"}</Label>
                  <Textarea rows={2} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>{ar ? "وصف مختصر (إنجليزي)" : "Short description (English)"}</Label>
                  <Textarea rows={2} dir="ltr" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground md:col-span-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-3.5 w-3.5 rounded border-input" />
                  {ar ? "تصنيف نشط" : "Active category"}
                </label>
              </div>
              <DialogFooter>
                <button type="button" onClick={() => setForm(null)} className="rounded-full border border-border px-4 py-2 text-xs hover:bg-muted">
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button type="submit" disabled={saving} className="rounded-full gradient-brand px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Move products */}
      <Dialog open={!!moveFrom} onOpenChange={(o) => !o && setMoveFrom(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {ar ? `نقل منتجات من: ${moveFrom?.name_ar}` : `Move products from: ${moveFrom?.name_en}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{ar ? "التصنيف الهدف" : "Target category"}</Label>
              <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{ar ? "بلا تصنيف" : "No category"}</option>
                {cats.filter((c) => c.id !== moveFrom?.id).map((c) => (
                  <option key={c.id} value={c.id}>{ar ? c.name_ar : c.name_en}</option>
                ))}
              </select>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {sourceProducts.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">{ar ? "لا توجد منتجات" : "No products"}</p>
              ) : sourceProducts.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox" checked={picked.includes(p.id)}
                    onChange={(e) => setPicked(e.target.checked ? [...picked, p.id] : picked.filter((x) => x !== p.id))}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  <span className="line-clamp-1">{ar ? p.name_ar : p.name_en}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setPicked(sourceProducts.map((p) => p.id))}
              className="rounded-full border border-border px-3 py-1 text-[11px] hover:bg-muted"
            >
              {ar ? "تحديد الكل" : "Select all"}
            </button>
          </div>
          <DialogFooter>
            <button onClick={() => setMoveFrom(null)} className="rounded-full border border-border px-4 py-2 text-xs hover:bg-muted">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button onClick={doMove} disabled={!picked.length} className="rounded-full gradient-brand px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
              {ar ? `نقل (${picked.length})` : `Move (${picked.length})`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
