// Administrator workspace shell — admin guard + administration sidebar.
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import {
  useAdminProducts, useAdminPendingRequests, stockOf, LOW_STOCK_THRESHOLD,
} from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "إدارة الشركة — ميتاكير" },
      { name: "description", content: "مساحة عمل الإدارة لمتابعة الأعمال والكتالوج والمخزون والفريق والتقارير." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminWorkspace,
});

function AdminWorkspace() {
  const { user, isAdmin, loading } = useAuth();
  const { lang } = useI18n();
  const enabled = !!user && isAdmin;

  const productsQ = useAdminProducts(enabled);
  const requestsQ = useAdminPendingRequests(enabled);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">…</div>;
  }

  if (!enabled) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="p-16 text-center text-muted-foreground">
          {lang === "ar" ? "هذه المساحة مخصصة للإدارة فقط" : "Administrator access only"}
          <div className="mt-4">
            <Link to="/" className="text-primary hover:underline">
              {lang === "ar" ? "العودة للرئيسية" : "Back home"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const products = (productsQ.data ?? []) as any[];
  const lowStock = products.filter((p) => p.is_active && stockOf(p) <= LOW_STOCK_THRESHOLD).length;

  const badges = {
    inventory: lowStock,
    registrations: ((requestsQ.data ?? []) as any[]).length,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <div className="flex w-full flex-1">
          <AdminSidebar badges={badges} />
          <main className="min-w-0 flex-1">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground">
                {lang === "ar" ? "مركز إدارة ميتاكير" : "Metacare administration center"}
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
