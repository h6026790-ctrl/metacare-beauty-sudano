// Purchase invoices — the standard way stock enters the warehouse.
// A draft invoice never touches inventory; approval is the only moment
// stock rises, and it records a linked inventory movement per product.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { CenterHeader, TableCard, Th, Td, EmptyRow } from "@/components/admin/ui";
import { useAdminProducts } from "@/components/admin/useAdminWorkspace";
import {
  adminListPurchaseInvoices, adminGetPurchaseInvoice, adminSavePurchaseInvoice,
  adminSaveInvoiceItem, adminDeleteInvoiceItem, adminDeletePurchaseInvoice,
  adminApprovePurchaseInvoice,
} from "@/lib/api/purchasing.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/inventory/purchases")({
  head: () => ({
    meta: [
      { title: "فواتير الشراء — إدارة ميتاكير" },
      { name: "description", content: "إدخال المخزون عبر فواتير شراء موثقة مع اعتماد يرفع الكميات ويسجل الحركة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPurchases,
});

function AdminPurchases() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, isAdmin } = useAuth();
  const enabled = !!user && isAdmin;
  const qc = useQueryClient();

  const listFn = useServerFn(adminListPurchaseInvoices);
  const getFn = useServerFn(adminGetPurchaseInvoice);
  const saveFn = useServerFn(adminSavePurchaseInvoice);
  const saveItemFn = useServerFn(adminSaveInvoiceItem);
  const delItemFn = useServerFn(adminDeleteInvoiceItem);
  const delFn = useServerFn(adminDeletePurchaseInvoice);
  const approveFn = useServerFn(adminApprovePurchaseInvoice);

  const invoicesQ = useQuery({ queryKey: ["adm-purchases"], queryFn: () => listFn(), enabled });
  const productsQ = useAdminProducts(enabled);
  const products = ((productsQ.data ?? []) as any[]).filter((p) => p.is_active);

  const [openId, setOpenId] = useState<string | null>(null);
  const [header, setHeader] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState({ product_id: "", qty: "1", purchase_price_sdg: "", selling_price_sdg: "" });

  const detailQ = useQuery({
    queryKey: ["adm-purchase", openId],
    queryFn: () => getFn({ data: { invoiceId: openId! } } as any),
    enabled: !!openId && enabled,
  });
  const invoice = detailQ.data as any;
  const invoices = (invoicesQ.data ?? []) as any[];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adm-purchases"] });
    if (openId) qc.invalidateQueries({ queryKey: ["adm-purchase", openId] });
  };

  const saveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!header) return;
    setBusy(true);
    try {
      const res: any = await saveFn({
        data: {
          ...(header.id ? { id: header.id } : {}),
          invoice_number: header.invoice_number.trim(),
          invoice_date: header.invoice_date,
          supplier_name: header.supplier_name.trim(),
          notes: header.notes?.trim() || null,
        },
      } as any);
      toast.success(ar ? "تم حفظ الفاتورة" : "Invoice saved");
      setHeader(null);
      refresh();
      if (!header.id && res?.id) setOpenId(res.id);
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر الحفظ" : "Could not save"));
    } finally { setBusy(false); }
  };

  const addItem = async () => {
    if (!openId || !item.product_id) return;
    const qty = Number(item.qty);
    const price = Number(item.purchase_price_sdg);
    if (!Number.isFinite(qty) || qty < 1) { toast.error(ar ? "الكمية غير صحيحة" : "Invalid quantity"); return; }
    if (!Number.isFinite(price) || price < 0) { toast.error(ar ? "سعر الشراء غير صحيح" : "Invalid purchase price"); return; }
    const sell = item.selling_price_sdg.trim() === "" ? null : Number(item.selling_price_sdg);
    setBusy(true);
    try {
      await saveItemFn({
        data: {
          invoice_id: openId, product_id: item.product_id, qty,
          purchase_price_sdg: price, selling_price_sdg: sell,
        },
      } as any);
      setItem({ product_id: "", qty: "1", purchase_price_sdg: "", selling_price_sdg: "" });
      refresh();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const removeItem = async (id: string) => {
    if (!openId) return;
    try {
      await delItemFn({ data: { itemId: id, invoiceId: openId } } as any);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const approve = async () => {
    if (!openId) return;
    setBusy(true);
    try {
      await approveFn({ data: { invoiceId: openId } } as any);
      toast.success(ar ? "تم اعتماد الفاتورة وتحديث المخزون" : "Invoice approved — stock updated");
      refresh();
      qc.invalidateQueries({ queryKey: ["adm-products"] });
      qc.invalidateQueries({ queryKey: ["adm-movements"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  const removeInvoice = async (id: string) => {
    try {
      await delFn({ data: { invoiceId: id } } as any);
      toast.success(ar ? "تم حذف المسودة" : "Draft deleted");
      if (openId === id) setOpenId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const draft = invoice?.status !== "approved";
  const items = (invoice?.items ?? []) as any[];
  const itemsTotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.purchase_price_sdg ?? 0), 0);

  return (
    <>
      <CenterHeader
        title={ar ? "فواتير الشراء" : "Purchase invoices"}
        sub={ar ? "الطريقة المعتمدة لإدخال المخزون. لا تتغير الكميات إلا بعد اعتماد الفاتورة." : "The standard stock intake path. Quantities change only after approval."}
      />

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setHeader({ invoice_number: "", invoice_date: new Date().toISOString().slice(0, 10), supplier_name: "", notes: "" })}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full gradient-brand px-4 text-xs font-medium text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" />{ar ? "فاتورة شراء جديدة" : "New purchase invoice"}
        </button>
      </div>

      <TableCard>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>{ar ? "رقم الفاتورة" : "Invoice no."}</Th>
            <Th>{ar ? "المورد" : "Supplier"}</Th>
            <Th>{ar ? "التاريخ" : "Date"}</Th>
            <Th align="end">{ar ? "الأصناف" : "Items"}</Th>
            <Th align="end">{ar ? "الإجمالي" : "Total"}</Th>
            <Th align="end">{ar ? "الحالة" : "Status"}</Th>
            <Th align="end">{ar ? "إجراء" : "Action"}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.length === 0 ? (
            <EmptyRow colSpan={7} label={ar ? "لا توجد فواتير شراء" : "No purchase invoices"} />
          ) : invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-muted/30">
              <Td><span className="font-mono text-xs">{inv.invoice_number}</span></Td>
              <Td>{inv.supplier_name}</Td>
              <Td><span className="font-mono text-xs">{inv.invoice_date}</span></Td>
              <Td align="end">{(inv.items ?? []).length}</Td>
              <Td align="end">{formatPrice(Number(inv.total_sdg ?? 0), lang)}</Td>
              <Td align="end">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${inv.status === "approved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
                  {inv.status === "approved" ? (ar ? "معتمدة" : "Approved") : (ar ? "مسودة" : "Draft")}
                </span>
              </Td>
              <Td align="end">
                <div className="inline-flex items-center gap-1.5">
                  <button onClick={() => setOpenId(inv.id)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                    {ar ? "فتح" : "Open"}
                  </button>
                  {inv.status !== "approved" && (
                    <button onClick={() => removeInvoice(inv.id)} className="rounded-full border border-border px-2.5 py-1 text-xs text-destructive hover:bg-muted">
                      {ar ? "حذف" : "Delete"}
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      {/* Header form */}
      <Dialog open={!!header} onOpenChange={(o) => !o && setHeader(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{header?.id ? (ar ? "تعديل بيانات الفاتورة" : "Edit invoice") : (ar ? "فاتورة شراء جديدة" : "New purchase invoice")}</DialogTitle>
          </DialogHeader>
          {header && (
            <form onSubmit={saveHeader} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{ar ? "رقم الفاتورة" : "Invoice number"}</Label>
                <Input required dir="ltr" value={header.invoice_number} onChange={(e) => setHeader({ ...header, invoice_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "تاريخ الفاتورة" : "Invoice date"}</Label>
                <Input required type="date" dir="ltr" value={header.invoice_date} onChange={(e) => setHeader({ ...header, invoice_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "اسم المورد" : "Supplier name"}</Label>
                <Input required value={header.supplier_name} onChange={(e) => setHeader({ ...header, supplier_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Textarea rows={2} value={header.notes ?? ""} onChange={(e) => setHeader({ ...header, notes: e.target.value })} />
              </div>
              <DialogFooter>
                <button type="button" onClick={() => setHeader(null)} className="rounded-full border border-border px-4 py-2 text-xs hover:bg-muted">
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button type="submit" disabled={busy} className="rounded-full gradient-brand px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  {ar ? "حفظ" : "Save"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice detail */}
      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {ar ? "فاتورة شراء" : "Purchase invoice"} {invoice?.invoice_number ? `— ${invoice.invoice_number}` : ""}
            </DialogTitle>
          </DialogHeader>

          {invoice && (
            <div className="space-y-4">
              <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs md:grid-cols-2">
                <p><span className="text-muted-foreground">{ar ? "المورد: " : "Supplier: "}</span>{invoice.supplier_name}</p>
                <p><span className="text-muted-foreground">{ar ? "التاريخ: " : "Date: "}</span>{invoice.invoice_date}</p>
                <p>
                  <span className="text-muted-foreground">{ar ? "الحالة: " : "Status: "}</span>
                  {invoice.status === "approved" ? (ar ? "معتمدة" : "Approved") : (ar ? "مسودة — لم يتأثر المخزون" : "Draft — inventory untouched")}
                </p>
                <p><span className="text-muted-foreground">{ar ? "الإجمالي: " : "Total: "}</span>{formatPrice(itemsTotal, lang)}</p>
                {invoice.notes && <p className="md:col-span-2"><span className="text-muted-foreground">{ar ? "ملاحظات: " : "Notes: "}</span>{invoice.notes}</p>}
                {draft && (
                  <button
                    onClick={() => setHeader({
                      id: invoice.id, invoice_number: invoice.invoice_number,
                      invoice_date: invoice.invoice_date, supplier_name: invoice.supplier_name,
                      notes: invoice.notes ?? "",
                    })}
                    className="justify-self-start rounded-full border border-border bg-background px-3 py-1 text-[11px] hover:bg-muted md:col-span-2"
                  >
                    {ar ? "تعديل بيانات الفاتورة" : "Edit invoice details"}
                  </button>
                )}
              </div>

              <TableCard>
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>{ar ? "المنتج" : "Product"}</Th>
                    <Th align="end">{ar ? "الكمية" : "Qty"}</Th>
                    <Th align="end">{ar ? "سعر الشراء" : "Purchase price"}</Th>
                    <Th align="end">{ar ? "سعر البيع الجديد" : "New selling price"}</Th>
                    <Th align="end">{ar ? "الإجمالي" : "Line total"}</Th>
                    {draft && <Th align="end">{ar ? "حذف" : "Remove"}</Th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <EmptyRow colSpan={draft ? 6 : 5} label={ar ? "أضف أصنافاً للفاتورة" : "Add invoice items"} />
                  ) : items.map((it) => (
                    <tr key={it.id}>
                      <Td>{ar ? it.product?.name_ar : it.product?.name_en}</Td>
                      <Td align="end"><span className="font-mono">{it.qty}</span></Td>
                      <Td align="end">{formatPrice(Number(it.purchase_price_sdg ?? 0), lang)}</Td>
                      <Td align="end">{it.selling_price_sdg != null ? formatPrice(Number(it.selling_price_sdg), lang) : "—"}</Td>
                      <Td align="end">{formatPrice(Number(it.qty) * Number(it.purchase_price_sdg ?? 0), lang)}</Td>
                      {draft && (
                        <Td align="end">
                          <button onClick={() => removeItem(it.id)} className="rounded-full border border-border p-1 text-destructive hover:bg-muted">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </TableCard>

              {draft ? (
                <div className="rounded-2xl border border-border p-3">
                  <p className="mb-2 text-xs font-medium text-foreground">{ar ? "إضافة صنف" : "Add item"}</p>
                  <div className="grid gap-2 md:grid-cols-5">
                    <select
                      value={item.product_id} onChange={(e) => setItem({ ...item, product_id: e.target.value })}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
                    >
                      <option value="">{ar ? "اختر المنتج" : "Select product"}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{ar ? p.name_ar : p.name_en}</option>)}
                    </select>
                    <Input type="number" min={1} dir="ltr" placeholder={ar ? "الكمية" : "Qty"} value={item.qty} onChange={(e) => setItem({ ...item, qty: e.target.value })} />
                    <Input type="number" min={0} step="0.01" dir="ltr" placeholder={ar ? "سعر الشراء" : "Purchase price"} value={item.purchase_price_sdg} onChange={(e) => setItem({ ...item, purchase_price_sdg: e.target.value })} />
                    <Input type="number" min={0} step="0.01" dir="ltr" placeholder={ar ? "سعر البيع (اختياري)" : "Selling price (optional)"} value={item.selling_price_sdg} onChange={(e) => setItem({ ...item, selling_price_sdg: e.target.value })} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button onClick={addItem} disabled={busy || !item.product_id} className="rounded-full border border-border px-3.5 py-1.5 text-xs hover:bg-muted disabled:opacity-50">
                      <Plus className="me-1 inline h-3 w-3" />{ar ? "إضافة" : "Add"}
                    </button>
                    <button onClick={approve} disabled={busy || items.length === 0} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-50">
                      <CheckCircle2 className="h-3.5 w-3.5" />{ar ? "اعتماد الفاتورة وتحديث المخزون" : "Approve & update stock"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl bg-success/10 p-3 text-xs text-success">
                  {ar
                    ? `تم اعتماد الفاتورة${invoice.approved_at ? ` بتاريخ ${new Date(invoice.approved_at).toLocaleString("ar")}` : ""} وتمت زيادة المخزون وتسجيل الحركات.`
                    : `Approved${invoice.approved_at ? ` on ${new Date(invoice.approved_at).toLocaleString("en")}` : ""} — stock increased and movements recorded.`}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
