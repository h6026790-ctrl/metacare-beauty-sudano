// Catalogue center — products, brands, archive / restore, and full editing.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { adminSoftDeleteProduct, adminRestoreProduct, adminUploadProductImage } from "@/lib/api/admin.functions";
import { adminUpsertProduct, adminUpsertBrand } from "@/lib/api/ops.functions";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminProducts, useAdminBrands, useAdminCategories } from "@/components/admin/useAdminWorkspace";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/catalog/")({
  head: () => ({
    meta: [
      { title: "الكتالوج — إدارة ميتاكير" },
      { name: "description", content: "إدارة المنتجات والعلامات التجارية مع الأرشفة والاستعادة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCatalog,
});

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type ProductForm = {
  id?: string;
  slug: string;
  name_ar: string; name_en: string;
  description_ar: string; description_en: string;
  price_sdg: string; compare_at_sdg: string;
  brand_id: string; category_id: string;
  image_url: string;
  is_active: boolean;
};

const EMPTY_PRODUCT: ProductForm = {
  slug: "", name_ar: "", name_en: "", description_ar: "", description_en: "",
  price_sdg: "", compare_at_sdg: "", brand_id: "", category_id: "", image_url: "",
  is_active: true,
};

type BrandForm = {
  id?: string;
  slug: string; name_ar: string; name_en: string;
  tagline_ar: string; tagline_en: string;
  is_active: boolean;
};

const EMPTY_BRAND: BrandForm = {
  slug: "", name_ar: "", name_en: "", tagline_ar: "", tagline_en: "", is_active: true,
};

function AdminCatalog() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(true);
  const [q, setQ] = useState("");


  const productsQ = useAdminProducts(enabled);
  const brandsQ = useAdminBrands(enabled);
  const categoriesQ = useAdminCategories(enabled);
  const softDelFn = useServerFn(adminSoftDeleteProduct);
  const restoreFn = useServerFn(adminRestoreProduct);
  const upsertProductFn = useServerFn(adminUpsertProduct);
  const upsertBrandFn = useServerFn(adminUpsertBrand);

  const [product, setProduct] = useState<ProductForm | null>(null);
  const [brand, setBrand] = useState<BrandForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(adminUploadProductImage);

  // Photos are uploaded to private storage and referenced by their served URL.
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });
      const res: any = await uploadFn({
        data: { fileName: file.name, contentType: file.type, base64 },
      } as any);
      setProduct((p) => (p ? { ...p, image_url: res.url } : p));
      toast.success(ar ? "تم رفع الصورة" : "Image uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر رفع الصورة" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };


  const all = (productsQ.data ?? []) as any[];
  const term = q.trim().toLowerCase();
  const products = (showArchived ? all : all.filter((p) => p.is_active))
    .filter((p) => !term || `${p.name_ar ?? ""} ${p.name_en ?? ""}`.toLowerCase().includes(term));

  const brands = (brandsQ.data ?? []) as any[];
  const categories = (categoriesQ.data ?? []) as any[];

  const toggleArchive = async (p: any) => {
    try {
      if (p.is_active) await softDelFn({ data: { productId: p.id } } as any);
      else await restoreFn({ data: { productId: p.id } } as any);
      toast.success(p.is_active ? (ar ? "تمت الأرشفة" : "Archived") : (ar ? "تمت الاستعادة" : "Restored"));
      qc.invalidateQueries({ queryKey: ["adm-products"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openProduct = (p?: any) => {
    setProduct(p ? {
      id: p.id, slug: p.slug,
      name_ar: p.name_ar ?? "", name_en: p.name_en ?? "",
      description_ar: p.description_ar ?? "", description_en: p.description_en ?? "",
      price_sdg: String(p.price_sdg ?? ""),
      compare_at_sdg: p.compare_at_sdg != null ? String(p.compare_at_sdg) : "",
      brand_id: p.brand_id ?? "", category_id: p.category_id ?? "",
      image_url: p.image_url ?? "", is_active: !!p.is_active,
    } : { ...EMPTY_PRODUCT });
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const price = Number(product.price_sdg);
    if (!Number.isFinite(price) || price < 0) {
      toast.error(ar ? "السعر غير صحيح" : "Invalid price");
      return;
    }
    const compare = product.compare_at_sdg.trim() === "" ? null : Number(product.compare_at_sdg);
    if (compare != null && (!Number.isFinite(compare) || compare < 0)) {
      toast.error(ar ? "سعر المقارنة غير صحيح" : "Invalid compare-at price");
      return;
    }
    setSaving(true);
    try {
      await upsertProductFn({
        data: {
          ...(product.id ? { id: product.id } : {}),
          slug: product.slug.trim() || slugify(product.name_en || product.name_ar),
          name_ar: product.name_ar.trim(),
          name_en: product.name_en.trim(),
          description_ar: product.description_ar.trim() || null,
          description_en: product.description_en.trim() || null,
          price_sdg: price,
          compare_at_sdg: compare,
          brand_id: product.brand_id || null,
          category_id: product.category_id || null,
          image_url: product.image_url.trim() || null,
          is_active: product.is_active,
          // Promotional flags are managed in the Offers center — never reset here.
        },

      } as any);
      toast.success(ar ? "تم حفظ المنتج" : "Product saved");
      setProduct(null);
      qc.invalidateQueries({ queryKey: ["adm-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر الحفظ" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const saveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;
    setSaving(true);
    try {
      await upsertBrandFn({
        data: {
          ...(brand.id ? { id: brand.id } : {}),
          slug: brand.slug.trim() || slugify(brand.name_en || brand.name_ar),
          name_ar: brand.name_ar.trim(), name_en: brand.name_en.trim(),
          tagline_ar: brand.tagline_ar.trim() || null,
          tagline_en: brand.tagline_en.trim() || null,
          is_active: brand.is_active,
        },
      } as any);
      toast.success(ar ? "تم حفظ العلامة" : "Brand saved");
      setBrand(null);
      qc.invalidateQueries({ queryKey: ["adm-brands"] });
      qc.invalidateQueries({ queryKey: ["brands"] });
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر الحفظ" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CenterHeader
        title={ar ? "الكتالوج" : "Catalogue"}
        sub={ar ? "المنتجات والعلامات التجارية المعروضة في المتجر." : "The products and brands presented in the store."}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث باسم المنتج…" : "Search by product name…"}
            className="h-10 w-full max-w-xs rounded-full border border-input bg-card px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-3.5 w-3.5 rounded border-input" />
            {ar ? "إظهار المنتجات المؤرشفة" : "Show archived products"}
          </label>
        </div>
        <button onClick={() => openProduct()} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full gradient-brand px-4 text-xs font-medium text-primary-foreground shadow-glow">
          <Plus className="h-3.5 w-3.5" />{ar ? "منتج جديد" : "New product"}

        </button>
      </div>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{ar ? "المنتج" : "Product"}</Th>
            <Th>{ar ? "العلامة" : "Brand"}</Th>
            <Th align="end">{ar ? "السعر" : "Price"}</Th>
            <Th align="end">{ar ? "الحالة" : "Status"}</Th>
            <Th align="end">{ar ? "إجراء" : "Action"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.length === 0 ? (
            <EmptyRow colSpan={5} label={ar ? "لا توجد منتجات" : "No products"} />
          ) : products.map((p) => (
            <tr key={p.id} className={`hover:bg-muted/30 ${p.is_active ? "" : "opacity-60"}`}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <img src={p.image_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  <span className="line-clamp-1">{ar ? p.name_ar : p.name_en}</span>
                </div>
              </Td>
              <Td>{ar ? p.brand?.name_ar : p.brand?.name_en}</Td>
              <Td align="end">{formatPrice(Number(p.price_sdg), lang)}</Td>
              <Td align="end">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {p.is_active ? (ar ? "نشط" : "Active") : (ar ? "مؤرشف" : "Archived")}
                </span>
              </Td>
              <Td align="end">
                <div className="inline-flex items-center gap-1.5">
                  <button onClick={() => openProduct(p)} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                    <Pencil className="h-3 w-3" />{ar ? "تعديل" : "Edit"}
                  </button>
                  <button onClick={() => toggleArchive(p)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                    {p.is_active ? (ar ? "أرشفة" : "Archive") : (ar ? "استعادة" : "Restore")}
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg text-foreground">{ar ? "العلامات التجارية" : "Brands"}</h2>
        <button onClick={() => setBrand({ ...EMPTY_BRAND })} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-medium hover:bg-muted">
          <Plus className="h-3.5 w-3.5" />{ar ? "علامة جديدة" : "New brand"}
        </button>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {brands.map((b) => (
          <li key={b.id} className={`flex items-center justify-between rounded-xl border border-border bg-card p-3 ${b.is_active ? "" : "opacity-60"}`}>
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand font-display text-base text-primary-foreground">
                {(ar ? b.name_ar : b.name_en).slice(0, 1)}
              </span>
              <span className="text-sm font-medium text-foreground">{ar ? b.name_ar : b.name_en}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{b.slug}</span>
              <button
                onClick={() => setBrand({
                  id: b.id, slug: b.slug, name_ar: b.name_ar, name_en: b.name_en,
                  tagline_ar: b.tagline_ar ?? "", tagline_en: b.tagline_en ?? "",
                  is_active: !!b.is_active,
                })}
                className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
              >
                {ar ? "تعديل" : "Edit"}
              </button>
            </span>
          </li>
        ))}
      </ul>

      {/* Product form */}
      <Dialog open={!!product} onOpenChange={(o) => !o && setProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{product?.id ? (ar ? "تعديل المنتج" : "Edit product") : (ar ? "منتج جديد" : "New product")}</DialogTitle>
          </DialogHeader>
          {product && (
            <form onSubmit={saveProduct} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={ar ? "الاسم بالعربية" : "Name (Arabic)"}>
                  <Input required value={product.name_ar} onChange={(e) => setProduct({ ...product, name_ar: e.target.value })} />
                </Field>
                <Field label={ar ? "الاسم بالإنجليزية" : "Name (English)"}>
                  <Input required dir="ltr" value={product.name_en}
                    onChange={(e) => setProduct({
                      ...product, name_en: e.target.value,
                      slug: product.id ? product.slug : slugify(e.target.value),
                    })} />
                </Field>
                <Field label={ar ? "المعرّف (slug)" : "Slug"}>
                  {product.id ? (
                    <Input readOnly dir="ltr" value={product.slug} className="bg-muted text-muted-foreground" />
                  ) : (
                    <Input required dir="ltr" value={product.slug} onChange={(e) => setProduct({ ...product, slug: slugify(e.target.value) })} />
                  )}
                </Field>

                <Field label={ar ? "السعر (ج.س)" : "Price (SDG)"}>
                  <Input required type="number" min={0} step="0.01" dir="ltr" value={product.price_sdg} onChange={(e) => setProduct({ ...product, price_sdg: e.target.value })} />
                </Field>
                <Field label={ar ? "السعر قبل الخصم (اختياري)" : "Compare-at price (optional)"}>
                  <Input type="number" min={0} step="0.01" dir="ltr" value={product.compare_at_sdg} onChange={(e) => setProduct({ ...product, compare_at_sdg: e.target.value })} />
                </Field>
                <Field label={ar ? "العلامة التجارية" : "Brand"}>
                  <select value={product.brand_id} onChange={(e) => setProduct({ ...product, brand_id: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{ar ? b.name_ar : b.name_en}</option>)}
                  </select>
                </Field>
                <Field label={ar ? "التصنيف" : "Category"}>
                  <select value={product.category_id} onChange={(e) => setProduct({ ...product, category_id: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{ar ? c.name_ar : c.name_en}</option>)}
                  </select>
                </Field>
                <Field label={ar ? "صورة المنتج" : "Product image"} className="md:col-span-2">
                  <div className="space-y-2">
                    <Input dir="ltr" placeholder="https://…" value={product.image_url} onChange={(e) => setProduct({ ...product, image_url: e.target.value })} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
                      className="block w-full text-xs text-muted-foreground file:me-3 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-xs file:font-medium"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {ar ? "JPG أو PNG أو WEBP، بحد أقصى ٣ ميجابايت." : "JPG, PNG or WEBP — up to 3 MB."}
                    </p>
                  </div>
                </Field>
                {product.image_url && (
                  <img src={product.image_url} alt="" className="h-24 w-24 rounded-xl object-cover md:col-span-2" />
                )}

                <Field label={ar ? "الوصف بالعربية" : "Description (Arabic)"} className="md:col-span-2">
                  <Textarea rows={3} value={product.description_ar} onChange={(e) => setProduct({ ...product, description_ar: e.target.value })} />
                </Field>
                <Field label={ar ? "الوصف بالإنجليزية" : "Description (English)"} className="md:col-span-2">
                  <Textarea rows={3} dir="ltr" value={product.description_en} onChange={(e) => setProduct({ ...product, description_en: e.target.value })} />
                </Field>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={product.is_active} onChange={(e) => setProduct({ ...product, is_active: e.target.checked })} className="h-3.5 w-3.5 rounded border-input" />
                {ar ? "منشور في المتجر" : "Published in the store"}
              </label>
              <DialogFooter>
                <button type="submit" disabled={saving} className="min-h-[42px] rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50">
                  {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Brand form */}
      <Dialog open={!!brand} onOpenChange={(o) => !o && setBrand(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{brand?.id ? (ar ? "تعديل العلامة" : "Edit brand") : (ar ? "علامة جديدة" : "New brand")}</DialogTitle>
          </DialogHeader>
          {brand && (
            <form onSubmit={saveBrand} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={ar ? "الاسم بالعربية" : "Name (Arabic)"}>
                  <Input required value={brand.name_ar} onChange={(e) => setBrand({ ...brand, name_ar: e.target.value })} />
                </Field>
                <Field label={ar ? "الاسم بالإنجليزية" : "Name (English)"}>
                  <Input required dir="ltr" value={brand.name_en}
                    onChange={(e) => setBrand({ ...brand, name_en: e.target.value, slug: brand.id ? brand.slug : slugify(e.target.value) })} />
                </Field>
                <Field label={ar ? "المعرّف (slug)" : "Slug"} className="md:col-span-2">
                  <Input required dir="ltr" value={brand.slug} onChange={(e) => setBrand({ ...brand, slug: slugify(e.target.value) })} />
                </Field>
                <Field label={ar ? "الوصف المختصر بالعربية" : "Tagline (Arabic)"} className="md:col-span-2">
                  <Input value={brand.tagline_ar} onChange={(e) => setBrand({ ...brand, tagline_ar: e.target.value })} />
                </Field>
                <Field label={ar ? "الوصف المختصر بالإنجليزية" : "Tagline (English)"} className="md:col-span-2">
                  <Input dir="ltr" value={brand.tagline_en} onChange={(e) => setBrand({ ...brand, tagline_en: e.target.value })} />
                </Field>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={brand.is_active} onChange={(e) => setBrand({ ...brand, is_active: e.target.checked })} className="h-3.5 w-3.5 rounded border-input" />
                {ar ? "ظاهرة في المتجر" : "Visible in the store"}
              </label>
              <DialogFooter>
                <button type="submit" disabled={saving} className="min-h-[42px] rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50">
                  {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
