// Orders Center — the main operational surface for Customer Service.
// Uses only existing server functions; no business-rule changes.
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  claimOrder, updateOrderStatus, markOutForDelivery, addOrderNote, listOrderNotes,
} from "@/lib/api/ops.functions";
import { useStaffOrders, useUnassignedOrders } from "./useStaffWorkspace";
import { useI18n } from "@/i18n/I18nProvider";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { formatPrice, whatsappLink } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MessageCircle, CheckCircle2, Truck, Search, Phone, MapPin, Package, Clock, StickyNote,
} from "lucide-react";

const TABS = [
  { key: "unassigned", ar: "غير مُسندة", en: "Unassigned" },
  { key: "new", ar: "جديدة", en: "New" },
  { key: "review", ar: "قيد المراجعة", en: "Under review" },
  { key: "paid", ar: "مدفوعة", en: "Paid" },
  { key: "shipping", ar: "خارج للتوصيل", en: "Out for delivery" },
  { key: "delivered", ar: "تم التسليم", en: "Delivered" },
  { key: "cancelled", ar: "ملغاة", en: "Cancelled" },
  { key: "returned", ar: "مرتجعة", en: "Returned" },
];

export function OrdersCenter({ enabled, initialTab = "new" }: { enabled: boolean; initialTab?: string }) {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState(initialTab);
  const [selectedRaw, setSelected] = useState<any | null>(null);
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [courierNote, setCourierNote] = useState("");
  const [payRef, setPayRef] = useState("");



  const ordersQ = useStaffOrders(enabled, q);
  const unassQ = useUnassignedOrders(enabled);

  const claim = useServerFn(claimOrder);
  const setStatus = useServerFn(updateOrderStatus);
  const markOut = useServerFn(markOutForDelivery);
  const addNote = useServerFn(addOrderNote);
  const listNotes = useServerFn(listOrderNotes);

  const notesQ = useQuery({
    queryKey: ["staff-notes", selectedRaw?.id],
    queryFn: () => listNotes({ data: { orderId: selectedRaw.id } } as any),
    enabled: enabled && !!selectedRaw?.id,
  });


  const orders = (ordersQ.data ?? []) as any[];
  const unassigned = (unassQ.data ?? []) as any[];

  // Always render the freshest server copy of the selected order so the
  // payment reference / delivery code appear right after each step.
  const selected = selectedRaw ? (orders.find((o) => o.id === selectedRaw.id) ?? selectedRaw) : null;
  const assignment = selected
    ? (Array.isArray(selected.delivery_assignment) ? selected.delivery_assignment[0] : selected.delivery_assignment) ?? null
    : null;


  const counts = useMemo(() => {
    const c: Record<string, number> = { unassigned: unassigned.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders, unassigned]);

  const rows = tab === "unassigned" ? unassigned : orders.filter((o) => o.status === tab);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["staff-orders"] });
    qc.invalidateQueries({ queryKey: ["staff-unassigned"] });
  };

  const onStatus = async (status: string) => {
    if (!selected) return;
    const ref = payRef.trim();
    if (status === "paid" && ref.length < 3) {
      toast.error(lang === "ar" ? "أدخلي مرجع الدفع أولاً" : "Enter the payment reference first");
      return;
    }
    try {
      await setStatus({ data: { orderId: selected.id, status, paymentReference: status === "paid" ? ref : undefined } } as any);
      toast.success(lang === "ar" ? "تم التحديث" : "Updated");
      if (status === "paid") setPayRef("");
      setSelected({ ...selected, status });
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };


  const onClaim = async (orderId: string) => {
    try {
      await claim({ data: { orderId } } as any);
      toast.success(lang === "ar" ? "تم الاستلام" : "Claimed");
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const onMarkOut = async () => {
    if (!selected) return;
    if (!courierName.trim()) {
      toast.error(lang === "ar" ? "أدخلي اسم المندوب" : "Enter the courier name");
      return;
    }
    try {
      await markOut({ data: {
        orderId: selected.id,
        courierName: courierName.trim(),
        courierPhone: courierPhone.trim() || undefined,
        courierNote: courierNote.trim() || undefined,
      } } as any);
      toast.success(lang === "ar" ? "تم التسليم للمندوب" : "Marked out for delivery");
      setCourierName(""); setCourierPhone(""); setCourierNote("");
      setSelected({ ...selected, status: "shipping" });
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {lang === "ar" ? t.ar : t.en}
            {(counts[t.key] ?? 0) > 0 && <span className="ms-1.5 opacity-80">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="rounded-2xl border border-border bg-card shadow-glass">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "0.75rem" }} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={lang === "ar" ? "بحث برقم الطلب أو اسم العميلة" : "Search by order number or customer"}
                className="h-9 rounded-full bg-muted/60 ps-9 text-xs"
              />
            </div>
          </div>
          <ul className="divide-y divide-border">
            {rows.length === 0 && (
              <li className="p-10 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لا توجد طلبات في هذه القائمة" : "Nothing in this queue"}
              </li>
            )}
            {rows.map((o) => (
              <li key={o.id} className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(o)}
                  className={`flex flex-1 items-center justify-between gap-3 p-4 text-start transition ${
                    selected?.id === o.id ? "bg-primary-soft" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium tracking-wider text-foreground">{o.number}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {o.contact_name} • <span dir="ltr">{o.contact_phone}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatPrice(Number(o.total_sdg), lang)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </button>
                {tab === "unassigned" && (
                  <button
                    onClick={() => onClaim(o.id)}
                    className="me-3 shrink-0 rounded-full gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow"
                  >
                    {lang === "ar" ? "استلام" : "Claim"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass lg:sticky lg:top-24 lg:self-start">
          {!selected ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "اختاري طلباً لبدء العمل" : "Select an order to start working"}
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{lang === "ar" ? "رقم الطلب" : "Order"}</p>
                  <p className="font-mono text-base font-medium text-foreground">{selected.number}</p>
                </div>
                <OrderStatusBadge status={selected.status} />
              </div>

              <div className="my-2 h-px bg-border" />
              <p className="text-sm font-medium text-foreground">{selected.contact_name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={whatsappLink(selected.contact_whatsapp ?? selected.contact_phone, `مرحباً ${selected.contact_name}،\nبخصوص الطلب ${selected.number}`)}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-medium text-success-foreground hover:opacity-90"
                >
                  <MessageCircle className="h-3.5 w-3.5" />{lang === "ar" ? "واتساب" : "WhatsApp"}
                </a>
                <a
                  href={`tel:${selected.contact_phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                >
                  <Phone className="h-3.5 w-3.5" /><span dir="ltr">{selected.contact_phone}</span>
                </a>
              </div>
              <p className="inline-flex items-start gap-1.5 text-xs text-foreground">
                <MapPin className="mt-0.5 h-3 w-3 text-primary" />
                {selected.address_neighborhood ? `${selected.address_neighborhood}, ` : ""}
                {selected.address_street}, {selected.address_city}
              </p>

              <div className="my-2 h-px bg-border" />
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Package className="h-3 w-3" /> {lang === "ar" ? "المنتجات" : "Items"}
              </p>
              <ul className="space-y-1.5 text-xs">
                {(selected.order_items ?? []).map((it: any) => (
                  <li key={it.id} className="flex justify-between text-foreground">
                    <span className="line-clamp-1">{it.name_snapshot} × {it.qty}</span>
                    <span className="text-muted-foreground">{formatPrice(Number(it.price_sdg) * it.qty, lang)}</span>
                  </li>
                ))}
              </ul>
              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === "ar" ? "الإجمالي" : "Total"}</span>
                <span className="font-display text-base text-foreground">{formatPrice(Number(selected.total_sdg), lang)}</span>
              </div>

              <div className="rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                <p className="inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {lang === "ar" ? "حجز المخزون" : "Inventory reservation"}:{" "}
                  <span className="font-medium text-foreground">
                    {["new", "review"].includes(selected.status)
                      ? (lang === "ar" ? "محجوز" : "Reserved")
                      : ["paid", "shipping", "delivered"].includes(selected.status)
                        ? (lang === "ar" ? "مُحوَّل لبيع" : "Converted to sale")
                        : (lang === "ar" ? "مُحرَّر" : "Released")}
                  </span>
                </p>
                <p className="mt-1">
                  {lang === "ar" ? "تاريخ الطلب" : "Placed"}:{" "}
                  {selected.placed_at ? new Date(selected.placed_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB") : "—"}
                </p>
              </div>

              <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {lang === "ar" ? "مرجع الدفع (إلزامي لتأكيد الدفع)" : "Payment reference (required to confirm payment)"}
                </p>
                <Input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder={lang === "ar" ? "رقم العملية / الإيصال" : "Transaction / receipt number"}
                  className="h-9 text-xs"
                />
              </div>

              <div className="mt-1 grid grid-cols-2 gap-2">
                <button onClick={() => onStatus("review")} className="rounded-full border border-border bg-card px-3 py-2 text-xs">
                  {lang === "ar" ? "تحت المراجعة" : "Mark review"}
                </button>
                <button
                  onClick={() => onStatus("paid")}
                  disabled={payRef.trim().length < 3}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-success px-3 py-2 text-xs font-medium text-success-foreground disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />{lang === "ar" ? "تأكيد الدفع" : "Confirm paid"}
                </button>

                <button onClick={() => onStatus("delivered")} className="rounded-full border border-border bg-card px-3 py-2 text-xs">
                  {lang === "ar" ? "تم التسليم" : "Delivered"}
                </button>
                <button onClick={() => onStatus("cancelled")} className="rounded-full border border-border bg-card px-3 py-2 text-xs text-destructive">
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>

              <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Truck className="h-3 w-3" /> {lang === "ar" ? "التسليم للمندوب (يدوي عبر واتساب)" : "Hand off to courier (manual via WhatsApp)"}
                </p>
                <Input
                  value={courierNote}
                  onChange={(e) => setCourierNote(e.target.value)}
                  placeholder={lang === "ar" ? "اسم المندوب / رقمه (اختياري)" : "Courier name / phone (optional)"}
                  className="h-9 text-xs"
                />
                <button onClick={onMarkOut} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full gradient-brand px-3 py-2 text-xs font-medium text-primary-foreground shadow-glow">
                  <Truck className="h-3.5 w-3.5" />{lang === "ar" ? "تحديد كخارج للتوصيل" : "Mark out for delivery"}
                </button>
              </div>

              <NoteBox
                orderId={selected.id}
                addNote={addNote}
                onSaved={() => qc.invalidateQueries({ queryKey: ["staff-notes", selected.id] })}
              />
              <div className="space-y-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <StickyNote className="h-3 w-3" /> {lang === "ar" ? "ملاحظات داخلية" : "Internal notes"}
                </p>
                {(notesQ.data ?? []).map((n: any) => (
                  <div key={n.id} className="rounded-lg border border-border bg-card p-2 text-xs text-foreground">
                    {n.body}
                    <span className="ms-2 text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function NoteBox({ orderId, addNote, onSaved }: { orderId: string; addNote: any; onSaved: () => void }) {
  const { lang } = useI18n();
  const [body, setBody] = useState("");
  return (
    <div className="mt-3 space-y-2">
      <Textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={lang === "ar" ? "ملاحظة داخلية" : "Internal note"}
        className="text-xs"
      />
      <button
        onClick={async () => {
          if (!body.trim()) return;
          await addNote({ data: { orderId, body } });
          setBody("");
          onSaved();
          toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
        }}
        className="rounded-full gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow"
      >
        {lang === "ar" ? "إضافة ملاحظة" : "Add note"}
      </button>
    </div>
  );
}
