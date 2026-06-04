import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { LayoutDashboard, Package, Users, Tags, Truck, BarChart3, Image as ImageIcon, ShoppingBag, UserCog } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Metacare" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const { t, lang } = useI18n();
  return <PanelShell title={t.panels.admin.title} sub={t.panels.admin.sub} accent="primary">
    <div className="grid gap-3 md:grid-cols-3">
      <Card title={lang === "ar" ? "المنتجات" : "Products"} icon={Package} value="8" />
      <Card title={lang === "ar" ? "الطلبات اليوم" : "Today's orders"} icon={ShoppingBag} value="—" />
      <Card title={lang === "ar" ? "الإيرادات" : "Revenue"} icon={BarChart3} value="—" />
      <Tile icon={Package} label={lang === "ar" ? "إدارة المنتجات" : "Products"} />
      <Tile icon={Tags} label={lang === "ar" ? "الأقسام والعلامات" : "Categories & brands"} />
      <Tile icon={ShoppingBag} label={lang === "ar" ? "الطلبات" : "Orders"} />
      <Tile icon={Users} label={lang === "ar" ? "العملاء" : "Customers"} />
      <Tile icon={UserCog} label={lang === "ar" ? "خدمة العملاء" : "Customer service"} />
      <Tile icon={Truck} label={lang === "ar" ? "المندوبون" : "Delivery agents"} />
      <Tile icon={ImageIcon} label={lang === "ar" ? "البانرات والصفحة الرئيسية" : "Banners & homepage"} />
      <Tile icon={BarChart3} label={lang === "ar" ? "التقارير والتحليلات" : "Reports & analytics"} />
      <Tile icon={LayoutDashboard} label={lang === "ar" ? "إعدادات نهاية اليوم" : "End-of-day settings"} />
    </div>
  </PanelShell>;
}

export function PanelShell({ title, sub, accent, children }: { title: string; sub: string; accent: "primary" | "violet" | "accent"; children: React.ReactNode }) {
  const { t, lang } = useI18n();
  const bg = accent === "violet" ? "from-violet to-primary" : accent === "accent" ? "from-accent to-primary" : "from-primary to-accent";
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className={`mb-6 overflow-hidden rounded-3xl bg-gradient-to-br ${bg} p-8 text-primary-foreground shadow-elevated`}>
          <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium backdrop-blur">{t.panels.previewBadge}</span>
          <h1 className="mt-3 font-display text-4xl">{title}</h1>
          <p className="mt-1 text-sm opacity-90">{sub}</p>
        </div>
        {children}
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-5 text-center text-xs text-muted-foreground">
          {lang === "ar" ? "هذه واجهة معاينة. الوظائف الكاملة تأتي في المرحلة الثالثة." : "Preview surface. Full functionality lands in Phase 3."}
          {" "}
          <Link to="/" className="text-primary hover:underline">{t.confirm.backHome}</Link>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, icon: Icon, value }: { title: string; icon: typeof Package; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground"><Icon className="h-4 w-4" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="font-display text-2xl text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
function Tile({ icon: Icon, label }: { icon: typeof Package; label: string }) {
  return (
    <button className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-start shadow-glass transition hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary"><Icon className="h-4 w-4" /></div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}
