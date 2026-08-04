// Notifications Center — one operational feed derived from existing queues.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { usePendingRequests, useStaffOrders, useUnassignedOrders, splitRequests } from "@/components/staff/useStaffWorkspace";
import { Bell, ClipboardList, UserPlus, KeyRound, Truck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/staff/notifications")({
  head: () => ({
    meta: [
      { title: "مركز التنبيهات — خدمة العملاء ميتاكير" },
      { name: "description", content: "تنبيهات تشغيلية موحّدة: طلبات جديدة، مدفوعات، طلبات تسجيل واستعادة كلمة المرور." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsCenter,
});

function NotificationsCenter() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  const enabled = !!user && isStaff;

  const ordersQ = useStaffOrders(enabled);
  const unassQ = useUnassignedOrders(enabled);
  const reqQ = usePendingRequests(enabled);

  const orders = (ordersQ.data ?? []) as any[];
  const unassigned = (unassQ.data ?? []) as any[];
  const { registrations, resets } = splitRequests((reqQ.data ?? []) as any[]);

  const feed = [
    ...unassigned.map((o) => ({
      id: `u-${o.id}`, at: o.placed_at, icon: ClipboardList, to: "/staff/orders",
      ar: `طلب جديد غير مُسند ${o.number}`, en: `New unassigned order ${o.number}`,
    })),
    ...orders.filter((o) => o.status === "new").map((o) => ({
      id: `n-${o.id}`, at: o.placed_at, icon: ClipboardList, to: "/staff/orders",
      ar: `طلب بانتظار المراجعة ${o.number}`, en: `Order awaiting review ${o.number}`,
    })),
    ...orders.filter((o) => o.status === "paid").map((o) => ({
      id: `p-${o.id}`, at: o.placed_at, icon: CheckCircle2, to: "/staff/orders",
      ar: `تم تأكيد الدفع — جاهز للتوصيل ${o.number}`, en: `Payment confirmed — ready for delivery ${o.number}`,
    })),
    ...orders.filter((o) => o.status === "shipping").map((o) => ({
      id: `s-${o.id}`, at: o.placed_at, icon: Truck, to: "/staff/orders",
      ar: `بانتظار تأكيد التسليم ${o.number}`, en: `Awaiting delivery confirmation ${o.number}`,
    })),
    ...registrations.map((r) => ({
      id: `r-${r.id}`, at: r.created_at, icon: UserPlus, to: "/staff/registrations",
      ar: `طلب تسجيل جديد — ${r.full_name}`, en: `New registration request — ${r.full_name}`,
    })),
    ...resets.map((r) => ({
      id: `k-${r.id}`, at: r.created_at, icon: KeyRound, to: "/staff/resets",
      ar: `طلب استعادة كلمة المرور — ${r.full_name}`, en: `Password reset request — ${r.full_name}`,
    })),
  ].sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());

  return (
    <div className="space-y-4">
      <h1 className="inline-flex items-center gap-2 font-display text-2xl text-foreground">
        <Bell className="h-5 w-5 text-primary" />
        {lang === "ar" ? "مركز التنبيهات" : "Notifications Center"}
      </h1>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-glass">
        {feed.length === 0 && (
          <li className="p-10 text-center text-sm text-muted-foreground">
            {lang === "ar" ? "لا توجد تنبيهات" : "No notifications"}
          </li>
        )}
        {feed.map((n) => (
          <li key={n.id}>
            <Link to={n.to} className="flex items-center justify-between gap-3 p-4 transition hover:bg-muted/40">
              <span className="inline-flex items-center gap-2 text-sm text-foreground">
                <n.icon className="h-4 w-4 text-primary" />
                {lang === "ar" ? n.ar : n.en}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {n.at ? new Date(n.at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB") : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
