// Lightweight live Staff dashboard — assigned orders, status transitions,
// payment confirmation, delivery assignment. Admin sees all orders.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listStaffOrders, listUnassignedOrders, claimOrder, updateOrderStatus,
  assignDeliveryAgent, addOrderNote, listOrderNotes, listTeam,
} from "@/lib/api/ops.functions";
import { formatPrice, whatsappLink } from "@/lib/format";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, CheckCircle2, Truck, Search, Phone, MapPin, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Customer Service — Metacare" }] }),
  component: StaffPanel,
});

function StaffPanel() {
  const { t, lang } = useI18n();
  const { user, isStaff, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const listMine = useServerFn(listStaffOrders);
  const listUnass = useServerFn(listUnassignedOrders);
  const claim = useServerFn(claimOrder);
  const setStatus = useServerFn(updateOrderStatus);
  const assign = useServerFn(assignDeliveryAgent);
  const addNote = useServerFn(addOrderNote);
  const listNotes = useServerFn(listOrderNotes);
  const teamFn = useServerFn(listTeam);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const ordersQ = useQuery({ queryKey: ["staff-orders", q], queryFn: () => listMine({ data: { q: q || undefined } } as any), enabled: !!user && isStaff });
  const unassQ = useQuery({ queryKey: ["staff-unassigned"], queryFn: () => listUnass(), enabled: !!user && isStaff });
  const teamQ = useQuery({ queryKey: ["staff-team"], queryFn: () => teamFn(), enabled: !!user && isStaff });
  const notesQ = useQuery({ queryKey: ["staff-notes", selected?.id], queryFn: () => listNotes({ data: { orderId: selected.id } } as any), enabled: !!user && isStaff && !!selected?.id });

  if (loading) return <AppShell><div className="p-16 text-center">…</div></AppShell>;
  if (!user || !isStaff) {
    return <AppShell><div className="p-16 text-center text-muted-foreground">{lang === "ar" ? "هذه اللوحة لخدمة العملاء فقط" : "Customer Service access only"}<div className="mt-4"><Link to="/" className="text-primary hover:underline">{t.confirm.backHome}</Link></div></div></AppShell>;
  }

  const orders = (ordersQ.data ?? []) as any[];
  const unassigned = (unassQ.data ?? []) as any[];
  const agents = teamQ.data?.agents ?? [];

  const onStatus = async (status: string, note?: string) => {
    if (!selected) return;
    try { await setStatus({ data: { orderId: selected.id, status, note } } as any); toast.success("OK"); qc.invalidateQueries({ queryKey: ["staff-orders"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const onClaim = async (orderId: string) => {
    try { await claim({ data: { orderId } } as any); toast.success("Claimed"); qc.invalidateQueries({ queryKey: ["staff-unassigned"] }); qc.invalidateQueries({ queryKey: ["staff-orders"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const onAssign = async (agentId: string) => {
    if (!selected) return;
    try { await assign({ data: { orderId: selected.id, agentId } } as any); toast.success(lang === "ar" ? "تم الإسناد" : "Assigned"); qc.invalidateQueries({ queryKey: ["staff-orders"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-primary p-6 text-primary-foreground shadow-elevated md:p-8">
          <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium backdrop-blur">{isAdmin ? (lang === "ar" ? "مدير" : "Admin view") : (lang === "ar" ? "خدمة العملاء" : "Customer Service")}</span>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">{t.panels.staff.title}</h1>
          <p className="mt-1 text-sm opacity-90">{t.panels.staff.sub}</p>
        </div>

        {unassigned.length > 0 && (
          <section className="mb-6">
            <h3 className="mb-2 font-display text-lg text-foreground">{lang === "ar" ? "طلبات غير مُسندة" : "Unassigned queue"}</h3>
            <ul className="grid gap-2 md:grid-cols-2">
              {unassigned.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-glass">
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{o.number}</p>
                    <p className="text-xs text-muted-foreground">{o.contact_name} • <span dir="ltr">{o.contact_phone}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatPrice(Number(o.total_sdg), lang)}</span>
                    <button onClick={() => onClaim(o.id)} className="rounded-full gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow">
                      {lang === "ar" ? "استلام" : "Claim"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <div className="rounded-2xl border border-border bg-card shadow-glass">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "0.75rem" }} />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "ar" ? "بحث برقم الطلب أو الاسم" : "Search"} className="h-9 rounded-full bg-muted/60 ps-9 text-xs" />
              </div>
            </div>
            <ul className="divide-y divide-border">
              {orders.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد طلبات مسندة إليكِ بعد" : "No orders assigned to you yet"}</li>}
              {orders.map((o) => (
                <li key={o.id}>
                  <button onClick={() => setSelected(o)} className={`flex w-full items-center justify-between gap-3 p-4 text-start transition ${selected?.id === o.id ? "bg-primary-soft" : "hover:bg-muted/40"}`}>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium tracking-wider text-foreground">{o.number}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.contact_name} • <span dir="ltr">{o.contact_phone}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatPrice(Number(o.total_sdg), lang)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass lg:sticky lg:top-24">
            {!selected ? (
              <p className="p-6 text-center text-sm text-muted-foreground">{lang === "ar" ? "اختاري طلباً" : "Select an order"}</p>
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
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" /><span dir="ltr">{selected.contact_phone}</span></p>
                <p className="inline-flex items-start gap-1.5 text-xs text-foreground"><MapPin className="mt-0.5 h-3 w-3 text-primary" />{selected.address_neighborhood ? `${selected.address_neighborhood}, ` : ""}{selected.address_street}, {selected.address_city}</p>

                <div className="my-2 h-px bg-border" />
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Package className="h-3 w-3" /> {lang === "ar" ? "المنتجات" : "Items"}</p>
                <ul className="space-y-1.5 text-xs">
                  {(selected.order_items ?? []).map((it: any) => (
                    <li key={it.id} className="flex justify-between text-foreground">
                      <span className="line-clamp-1">{it.name_snapshot} × {it.qty}</span>
                      <span className="text-muted-foreground">{formatPrice(Number(it.price_sdg) * it.qty, lang)}</span>
                    </li>
                  ))}
                </ul>
                <div className="my-2 h-px bg-border" />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.cart.total}</span><span className="font-display text-base text-foreground">{formatPrice(Number(selected.total_sdg), lang)}</span></div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a href={whatsappLink(selected.contact_whatsapp, `مرحباً ${selected.contact_name}،\nبخصوص الطلب ${selected.number}`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-success px-3 py-2 text-xs font-medium text-success-foreground hover:opacity-90">
                    <MessageCircle className="h-3.5 w-3.5" />{lang === "ar" ? "واتساب" : "WhatsApp"}
                  </a>
                  <button onClick={() => onStatus("review")} className="rounded-full border border-border bg-card px-3 py-2 text-xs">{lang === "ar" ? "تحت المراجعة" : "Mark review"}</button>
                  <button onClick={() => onStatus("paid")} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-success px-3 py-2 text-xs font-medium text-success-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />{lang === "ar" ? "تأكيد الدفع" : "Confirm paid"}
                  </button>
                  <button onClick={() => onStatus("cancelled")} className="rounded-full border border-border bg-card px-3 py-2 text-xs text-destructive">{lang === "ar" ? "إلغاء" : "Cancel"}</button>
                </div>

                <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
                  <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Truck className="h-3 w-3" /> {lang === "ar" ? "إسناد مندوب" : "Assign agent"}</p>
                  <select onChange={(e) => e.target.value && onAssign(e.target.value)} defaultValue="" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">{lang === "ar" ? "اختاري مندوباً" : "Select agent"}</option>
                    {agents.map((a: any) => <option key={a.id} value={a.id}>{a.full_name || a.phone}</option>)}
                  </select>
                </div>

                <NoteBox orderId={selected.id} onSaved={() => qc.invalidateQueries({ queryKey: ["staff-notes", selected.id] })} addNote={addNote} />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "ملاحظات" : "Notes"}</p>
                  {(notesQ.data ?? []).map((n: any) => (
                    <div key={n.id} className="rounded-lg border border-border bg-card p-2 text-xs text-foreground">{n.body}</div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function NoteBox({ orderId, addNote, onSaved }: { orderId: string; addNote: any; onSaved: () => void }) {
  const [body, setBody] = useState("");
  return (
    <div className="mt-3 space-y-2">
      <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Internal note" className="text-xs" />
      <button onClick={async () => { if (!body.trim()) return; await addNote({ data: { orderId, body } }); setBody(""); onSaved(); toast.success("Saved"); }} className="rounded-full gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow">Add note</button>
    </div>
  );
}
