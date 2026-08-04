// Customer Service workspace shell — guard + operational sidebar.
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/Header";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { usePendingRequests, useUnassignedOrders, useStaffOrders, splitRequests } from "@/components/staff/useStaffWorkspace";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "مكتب خدمة العملاء — ميتاكير" },
      { name: "description", content: "مساحة عمل خدمة العملاء لمتابعة الطلبات وطلبات التسجيل والتواصل مع العميلات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffWorkspace,
});

function StaffWorkspace() {
  const { user, isStaff, loading } = useAuth();
  const { lang } = useI18n();
  const enabled = !!user && isStaff;

  const requestsQ = usePendingRequests(enabled);
  const unassQ = useUnassignedOrders(enabled);
  const ordersQ = useStaffOrders(enabled);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">…</div>;
  }

  if (!enabled) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="p-16 text-center text-muted-foreground">
          {lang === "ar" ? "هذه المساحة مخصصة لخدمة العملاء" : "Customer Service access only"}
          <div className="mt-4">
            <Link to="/" className="text-primary hover:underline">{lang === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
          </div>
        </div>
      </div>
    );
  }

  const { registrations, resets } = splitRequests((requestsQ.data ?? []) as any[]);
  const orders = (ordersQ.data ?? []) as any[];
  const actionable = orders.filter((o) => ["new", "review", "paid"].includes(o.status)).length
    + ((unassQ.data ?? []) as any[]).length;

  const badges = {
    orders: actionable,
    registrations: registrations.length,
    resets: resets.length,
    notifications: actionable + registrations.length + resets.length,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <div className="flex w-full flex-1">
          <StaffSidebar badges={badges} />
          <main className="min-w-0 flex-1">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground">
                {lang === "ar" ? "مكتب العمليات اليومية" : "Daily operations desk"}
              </span>
            </div>
            <div className="mx-auto max-w-7xl px-4 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
