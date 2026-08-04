// My Activity — the logged-in employee's own operational trail.
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { useStaffOrders } from "@/components/staff/useStaffWorkspace";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { formatPrice } from "@/lib/format";
import { Activity, CheckCircle2, Truck, ClipboardList, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/staff/activity")({
  head: () => ({
    meta: [
      { title: "نشاطي — خدمة العملاء ميتاكير" },
      { name: "description", content: "متابعة عملك اليومي: الطلبات المُراجعة، المدفوعات المؤكدة، والتسليمات المُجهّزة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyActivity,
});

function MyActivity() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  const ordersQ = useStaffOrders(!!user && isStaff);
  const orders = (ordersQ.data ?? []) as any[];

  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const stats = [
    { icon: ClipboardList, n: orders.length, ar: "طلبات مُسندة إليك", en: "Orders assigned to you" },
    { icon: CheckCircle2, n: count("paid"), ar: "مدفوعات مؤكدة", en: "Payments confirmed" },
    { icon: Truck, n: count("shipping"), ar: "تسليمات مُجهّزة", en: "Deliveries prepared" },
    { icon: PackageCheck, n: count("delivered"), ar: "طلبات مُسلّمة", en: "Orders delivered" },
  ];

  const recent = [...orders]
    .sort((a, b) => new Date(b.placed_at ?? 0).getTime() - new Date(a.placed_at ?? 0).getTime())
    .slice(0, 15);

  return (
    <div className="space-y-5">
      <h1 className="inline-flex items-center gap-2 font-display text-2xl text-foreground">
        <Activity className="h-5 w-5 text-primary" />
        {lang === "ar" ? "نشاطي" : "My Activity"}
      </h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.ar} className="rounded-2xl border border-border bg-card p-4 shadow-glass">
            <s.icon className="h-4 w-4 text-primary" />
            <p className="mt-2 font-display text-2xl text-foreground">{s.n}</p>
            <p className="text-xs text-muted-foreground">{lang === "ar" ? s.ar : s.en}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-glass">
        <h2 className="border-b border-border p-4 font-display text-lg text-foreground">
          {lang === "ar" ? "أحدث ما عملت عليه" : "Recently worked on"}
        </h2>
        <ul className="divide-y divide-border">
          {recent.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "لا يوجد نشاط بعد" : "No activity yet"}
            </li>
          )}
          {recent.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span className="font-mono text-foreground">{o.number}</span>
              <span className="truncate text-xs text-muted-foreground">{o.contact_name}</span>
              <span className="text-xs text-muted-foreground">{formatPrice(Number(o.total_sdg), lang)}</span>
              <OrderStatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
