// Customer Service workspace navigation — operational centers only.
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, UserPlus, KeyRound, Users, Bell, Activity, UserRound } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/i18n/I18nProvider";

export type StaffBadges = Partial<Record<string, number>>;

const items: { key: string; url: string; exact?: boolean; icon: typeof LayoutDashboard; ar: string; en: string }[] = [
  { key: "dashboard", url: "/staff", exact: true, icon: LayoutDashboard, ar: "لوحة العمل", en: "Dashboard" },
  { key: "orders", url: "/staff/orders", icon: ClipboardList, ar: "الطلبات", en: "Orders" },
  { key: "registrations", url: "/staff/registrations", icon: UserPlus, ar: "طلبات التسجيل", en: "Registrations" },
  { key: "resets", url: "/staff/resets", icon: KeyRound, ar: "استعادة كلمة المرور", en: "Password resets" },
  { key: "customers", url: "/staff/customers", icon: Users, ar: "العملاء", en: "Customers" },
  { key: "notifications", url: "/staff/notifications", icon: Bell, ar: "التنبيهات", en: "Notifications" },
  { key: "activity", url: "/staff/activity", icon: Activity, ar: "نشاطي", en: "My activity" },
  { key: "profile", url: "/staff/profile", icon: UserRound, ar: "ملفي الشخصي", en: "My profile" },
];


export function StaffSidebar({ badges = {} }: { badges?: StaffBadges }) {
  const { lang } = useI18n();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" side={lang === "ar" ? "right" : "left"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{lang === "ar" ? "مكتب خدمة العملاء" : "Customer Service desk"}</SidebarGroupLabel>
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
