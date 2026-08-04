// Dashboard — "what requires my attention right now?"
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { usePendingRequests, useStaffOrders, useUnassignedOrders, splitRequests } from "@/components/staff/useStaffWorkspace";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { formatPrice } from "@/lib/format";
import { ClipboardList, UserPlus, KeyRound, Inbox, CheckCircle2, Truck } from "lucide-react";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "لوحة العمل — خدمة العملاء ميتاكير" },
      { name: "description", content: "المهام التي تحتاج انتباهك الآن: طلبات جديدة، طلبات تسجيل، واستعادة كلمات المرور." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffDashboard,
});

function StaffDashboard() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  const enabled = !!user && isStaff;

  const ordersQ = useStaffOrders(enabled);
  const unassQ = useUnassignedOrders(enabled);
  const reqQ = usePendingRequests(enabled);

  const orders = (ordersQ.data ?? []) as any[];
  const unassigned = (unassQ.data ?? []) as any[];
  const { registrations, resets } = splitRequests((reqQ.data ?? []) as any[]);

  const byStatus = (s: string) => orders.filter((o) => o.status === s);
  const today = new Date().toDateString();
  const todayCount = orders.filter((o) => o.placed_at && new Date(o.placed_at).toDateString() === today).length;

  const cards = [
    { to: "/staff/orders", icon: Inbox, n: unassigned.length, ar: "طلبات غير مُسندة", en: "Unassigned orders" },
    { to: "/staff/orders", icon: ClipboardList, n: byStatus("new").length, ar: "طلبات جديدة", en: "New orders" },
    { to: "/staff/orders", icon: CheckCircle2, n: byStatus("review").length, ar: "بانتظار الدفع", en: "Awaiting payment" },
    { to: "/staff/orders", icon: Truck, n: byStatus("paid").length, ar: "جاهزة للتوصيل", en: "Ready for delivery" },
    { to: "/staff/registrations", icon: UserPlus, n: registrations.length, ar: "طلبات تسجيل", en: "Registration requests" },
    { to: "/staff/resets", icon: KeyRound, n: resets.length, ar: "استعادة كلمة المرور", en: "Password resets" },
  ];

  const attention = [...unassigned, ...byStatus("new"), ...byStatus("review")].slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-primary p-6 text-primary-foreground shadow-elevated md:p-8">
        <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
          {lang === "ar" ? "خدمة العملاء" : "Customer Service"}
        </span>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">
          {lang === "ar" ? "ما الذي يحتاج انتباهك الآن؟" : "What requires your attention right now?"}
        </h1>
        <p className="mt-1 text-sm opacity-90">
          {lang === "ar" ? `طلبات اليوم: ${todayCount}` : `Orders today: ${todayCount}`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.ar}
            to={c.to}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-glass transition hover:border-primary/40"
          >
            <span className="inline-flex items-center gap-2 text-sm text-foreground">
              <c.icon className="h-4 w-4 text-primary" />
              {lang === "ar" ? c.ar : c.en}
            </span>
            <span className={`font-display text-2xl ${c.n > 0 ? "text-primary" : "text-muted-foreground"}`}>{c.n}</span>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-glass">
        <h2 className="border-b border-border p-4 font-display text-lg text-foreground">
          {lang === "ar" ? "يحتاج إجراء" : "Requires action"}
        </h2>
        <ul className="divide-y divide-border">
          {attention.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "لا توجد مهام معلّقة — عمل ممتاز" : "No pending tasks — great work"}
            </li>
          )}
          {attention.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-mono text-sm text-foreground">{o.number}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {o.contact_name} • <span dir="ltr">{o.contact_phone}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatPrice(Number(o.total_sdg), lang)}</span>
                <OrderStatusBadge status={o.status} />
                <Link to="/staff/orders" className="rounded-full gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow">
                  {lang === "ar" ? "فتح" : "Open"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
