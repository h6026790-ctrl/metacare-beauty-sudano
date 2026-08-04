import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CustomerBottomNav } from "@/components/customer/CustomerBottomNav";
import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isStaff } = useAuth();
  const showTabs = !!user && !isStaff;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {showTabs && <div className="h-16 md:hidden" aria-hidden />}
      <CustomerBottomNav />
    </div>
  );
}
