import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/lib/api/queries";
import { buildNotifications } from "@/lib/notifications";
import { useReadNotifications } from "@/lib/customer-local";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { formatDate } from "@/lib/format";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Metacare Beauty" },
      { name: "description", content: "Order updates and Metacare Beauty announcements in one place." },
      { property: "og:title", content: "Notifications — Metacare Beauty" },
      { property: "og:description", content: "Order updates and Metacare Beauty announcements in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data: orders = [] } = useMyOrders();
  const { readIds, markRead, markAllRead } = useReadNotifications();
  const notifications = buildNotifications(orders as any[], lang);

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.customer.notifications}</h1>
          <p className="mt-3 text-muted-foreground">{lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please sign in first"}</p>
          <Link to="/auth" className="mt-6 inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl text-foreground">{t.customer.notifications}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.customer.notificationsSub}</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => markAllRead(notifications.map((n) => n.id))}
              className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              {t.customer.markAllRead}
            </button>
          )}
        </header>

        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <BellOff className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{t.customer.noNotifications}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => {
              const unread = !readIds.includes(n.id);
              return (
                <li key={n.id}>
                  <Link
                    to="/orders/$id"
                    params={{ id: n.orderId }}
                    search={{}}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border p-4 shadow-glass transition hover:shadow-elevated",
                      unread ? "border-primary/30 bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full", unread ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                        <OrderStatusBadge status={n.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                        {n.orderNumber} • {formatDate(n.at, lang)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
