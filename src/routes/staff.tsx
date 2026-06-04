import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { PanelShell } from "./admin";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import type { OrderStatus } from "@/lib/types";
import { MessageCircle, Truck, StickyNote, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Customer Service — Metacare" }] }),
  component: StaffPanel,
});

const SAMPLE: { number: string; customer: string; phone: string; status: OrderStatus }[] = [
  { number: "MC260604-1042", customer: "سارة محمد", phone: "0912345678", status: "new" },
  { number: "MC260604-2173", customer: "هدى علي", phone: "0911223344", status: "review" },
  { number: "MC260603-9981", customer: "آلاء عثمان", phone: "0918887766", status: "paid" },
];

function StaffPanel() {
  const { t, lang } = useI18n();
  return (
    <PanelShell title={t.panels.staff.title} sub={t.panels.staff.sub} accent="accent">
      <div className="rounded-2xl border border-border bg-card shadow-glass">
        <div className="border-b border-border p-4">
          <h3 className="font-display text-lg text-foreground">{lang === "ar" ? "الطلبات المُسندة إليكِ" : "Assigned orders"}</h3>
        </div>
        <ul className="divide-y divide-border">
          {SAMPLE.map((o) => (
            <li key={o.number} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-sm font-medium tracking-wider text-foreground">{o.number}</p>
                <p className="text-xs text-muted-foreground">{o.customer} • <span dir="ltr">{o.phone}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={o.status} />
                <Action icon={MessageCircle} label={lang === "ar" ? "واتساب" : "WhatsApp"} />
                <Action icon={CheckCircle2} label={lang === "ar" ? "تأكيد الدفع" : "Confirm payment"} />
                <Action icon={Truck} label={lang === "ar" ? "إسناد مندوب" : "Assign agent"} />
                <Action icon={StickyNote} label={lang === "ar" ? "ملاحظة" : "Note"} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  );
}

function Action({ icon: Icon, label }: { icon: typeof MessageCircle; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
