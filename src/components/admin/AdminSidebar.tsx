// Administrator workspace navigation — one center per administrative intent.
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingBag, Tags, Boxes, Users, UserCog,
  UserPlus, BarChart3, Activity, Settings, Sparkles, Truck, UserRound,
} from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/i18n/I18nProvider";

export type AdminBadges = Partial<Record<string, number>>;

const items: { key: string; url: string; exact?: boolean; icon: typeof LayoutDashboard; ar: string; en: string }[] = [
  { key: "overview", url: "/admin", exact: true, icon: LayoutDashboard, ar: "نظرة عامة", en: "Overview" },
  { key: "orders", url: "/admin/orders", icon: ShoppingBag, ar: "الطلبات", en: "Orders" },
  { key: "catalog", url: "/admin/catalog", icon: Tags, ar: "الكتالوج", en: "Catalogue" },
  { key: "offers", url: "/admin/offers", icon: Sparkles, ar: "العروض ومنتج اليوم", en: "Offers" },
  { key: "inventory", url: "/admin/inventory", icon: Boxes, ar: "المخزون", en: "Inventory" },
  { key: "delivery", url: "/admin/delivery", icon: Truck, ar: "التوصيل والرسوم", en: "Delivery" },
  { key: "customers", url: "/admin/customers", icon: Users, ar: "العملاء", en: "Customers" },
  { key: "team", url: "/admin/team", icon: UserCog, ar: "الفريق", en: "Team" },
  { key: "registrations", url: "/admin/registrations", icon: UserPlus, ar: "طلبات التسجيل", en: "Registrations" },
  { key: "reports", url: "/admin/reports", icon: BarChart3, ar: "التقارير", en: "Reports" },
  { key: "activity", url: "/admin/activity", icon: Activity, ar: "سجل النشاط", en: "Activity" },
  { key: "system", url: "/admin/system", icon: Settings, ar: "النظام", en: "System" },
  { key: "profile", url: "/admin/profile", icon: UserRound, ar: "حسابي", en: "My account" },

];


export function AdminSidebar({ badges = {} }: { badges?: AdminBadges }) {
  const { lang } = useI18n();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" side={lang === "ar" ? "right" : "left"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{lang === "ar" ? "إدارة الشركة" : "Company administration"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact ? pathname === item.url : pathname.startsWith(item.url);
                const badge = badges[item.key] ?? 0;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={active} tooltip={lang === "ar" ? item.ar : item.en}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="truncate">{lang === "ar" ? item.ar : item.en}</span>
                            {badge > 0 && (
                              <span className="ms-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
