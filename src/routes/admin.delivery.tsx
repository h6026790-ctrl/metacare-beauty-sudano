// Delivery center — neighborhoods and the delivery fee charged for each one.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { adminUpsertNeighborhood, adminDeleteNeighborhood } from "@/lib/api/admin.functions";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminNeighborhoods, useAdminCities } from "@/components/admin/useAdminWorkspace";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/delivery")({
  head: () => ({
    meta: [
      { title: "التوصيل والرسوم — إدارة ميتاكير" },
      { name: "description", content: "إدارة الأحياء ورسوم التوصيل المعتمدة عند إتمام الطلب." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDelivery,
});

type Form = {
  id?: string;
  city_id: string;
  name_ar: string; name_en: string;
  delivery_fee_sdg: string;
  is_active: boolean;
  sort_order: string;
};

function AdminDelivery() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;
  const qc = useQueryClient();

  const hoodsQ = useAdminNeighborhoods(enabled);
  const citiesQ = useAdminCities(enabled);
  const upsertFn = useServerFn(adminUpsertNeighborhood);
  const deleteFn = useServerFn(adminDeleteNeighborhood);

  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const hoods = (hoodsQ.data ?? []) as any[];
  const cities = (citiesQ.data ?? []) as any[];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adm-neighborhoods"] });
    qc.invalidateQueries({ queryKey: ["neighborhoods"] });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const fee = Number(form.delivery_fee_sdg);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error(ar ? "رسوم التوصيل غير صحيحة" : "Invalid delivery fee");
      return;
    }
    setSaving(true);
    try {
      await upsertFn({
        data: {
          ...(form.id ? { id: form.id } : {}),
          city_id: form.city_id,
          name_ar: form.name_ar.trim(),
          name_en: form.name_en.trim(),
          delivery_fee_sdg: fee,
          is_active: form.is_active,
          sort_order: Number(form.sort_order) || 0,
        },
      } as any);
      toast.success(ar ? "تم الحفظ" : "Saved");
      setForm(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر الحفظ" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h: any) => {
    const name = ar ? h.name_ar : h.name_en;
    if (!window.confirm(ar ? `حذف "${name}"؟` : `Delete "${name}"?`)) return;
    try {
      const res: any = await deleteFn({ data: { id: h.id } } as any);
      toast.success(res?.softDisabled
        ? (ar ? "الحي مرتبط بعناوين محفوظة، تم تعطيله بدل حذفه." : "In use by saved addresses — disabled instead of deleted.")
        : (ar ? "تم الحذف" : "Deleted"));
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر الحذف" : "Could not delete"));
    }
  };

  return (
    <>
      <CenterHeader
        title={ar ? "التوصيل والرسوم" : "Delivery & fees"}
        sub={ar ? "رسوم كل حي تُحتسب على الخادم عند إتمام الطلب." : "Each neighborhood fee is applied server-side at checkout."}
      />

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setForm({
            city_id: cities[0]?.id ?? "", name_ar: "", name_en: "",
            delivery_fee_sdg: "", is_active: true, sort_order: "0",
          })}
          disabled={cities.length === 0}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full gradient-brand px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />{ar ? "حي جديد" : "New neighborhood"}
        </button>
      </div>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{ar ? "الحي" : "Neighborhood"}</Th>
            <Th>{ar ? "المدينة" : "City"}</Th>
            <Th align="end">{ar ? "رسوم التوصيل" : "Delivery fee"}</Th>
            <Th align="end">{ar ? "الحالة" : "Status"}</Th>
            <Th align="end">{ar ? "إجراء" : "Action"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {hoods.length === 0 ? (
            <EmptyRow colSpan={5} label={ar ? "لا توجد أحياء" : "No neighborhoods"} />
          ) : hoods.map((h) => (
            <tr key={h.id} className={`hover:bg-muted/30 ${h.is_active ? "" : "opacity-60"}`}>
              <Td>{ar ? h.name_ar : h.name_en}</Td>
              <Td>{ar ? h.city?.name_ar : h.city?.name_en}</Td>
              <Td align="end">{formatPrice(Number(h.delivery_fee_sdg), lang)}</Td>
              <Td align="end">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${h.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {h.is_active ? (ar ? "مفعّل" : "Active") : (ar ? "معطّل" : "Disabled")}
                </span>
              </Td>
              <Td align="end">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    onClick={() => setForm({
                      id: h.id, city_id: h.city_id, name_ar: h.name_ar, name_en: h.name_en,
                      delivery_fee_sdg: String(h.delivery_fee_sdg ?? "0"),
                      is_active: !!h.is_active, sort_order: String(h.sort_order ?? 0),
                    })}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" />{ar ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => remove(h)}
                    className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />{ar ? "حذف" : "Delete"}
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.id ? (ar ? "تعديل الحي" : "Edit neighborhood") : (ar ? "حي جديد" : "New neighborhood")}</DialogTitle>
          </DialogHeader>
          {form && (
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "المدينة" : "City"}</Label>
                  <select
                    required value={form.city_id}
                    onChange={(e) => setForm({ ...form, city_id: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{ar ? c.name_ar : c.name_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "الاسم بالعربية" : "Name (Arabic)"}</Label>
                  <Input required value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
                  <Input required dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "رسوم التوصيل (ج.س)" : "Delivery fee (SDG)"}</Label>
                  <Input required type="number" min={0} step="0.01" dir="ltr" value={form.delivery_fee_sdg}
                    onChange={(e) => setForm({ ...form, delivery_fee_sdg: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "ترتيب العرض" : "Sort order"}</Label>
                  <Input type="number" min={0} dir="ltr" value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-3.5 w-3.5 rounded border-input" />
                {ar ? "متاح للاختيار عند الطلب" : "Selectable at checkout"}
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
