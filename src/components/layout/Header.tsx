import { Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useWishlist, useMyOrders } from "@/lib/api/queries";
import { buildNotifications } from "@/lib/notifications";
import { useReadNotifications } from "@/lib/customer-local";
import { Logo } from "@/components/brand/Logo";
import { Heart, Menu, Search, ShoppingBag, User, Globe, UserPlus, Bell, Package, LifeBuoy, LayoutDashboard, LogOut } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "home" as const },
  { to: "/products", key: "shop" as const },
  { to: "/categories", key: "categories" as const },
  { to: "/brands", key: "brands" as const },
  { to: "/offers", key: "offers" as const },
  { to: "/about", key: "about" as const },
  { to: "/contact", key: "contact" as const },
] as const;

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, isCustomer, isAdmin, isStaff, rolesLoading, signOut } = useAuth();
  const staffLike = !!user && !rolesLoading && isStaff;
  // While roles are still loading we optimistically keep the customer icons
  // visible for a signed-in user, so they don't flicker on every page load.
  const customerLike = !!user && (rolesLoading || isCustomer);
  const workspaceTo = isAdmin ? "/admin" : "/staff";

  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const { data: orders = [] } = useMyOrders();
  const { readIds } = useReadNotifications();

  const cartCount = (cart?.items ?? []).reduce((s: number, i: any) => s + (i.qty ?? 0), 0);
  const wishCount = wishlist?.length ?? 0;
  const unreadCount = isCustomer
    ? buildNotifications(orders as any[], lang).filter((n) => !readIds.includes(n.id)).length
    : 0;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
  };

  // Admin / staff accounts are fully isolated from the storefront:
  // logo → their workspace, plus sign out. Nothing else.
  if (staffLike) {
    return (
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to={workspaceTo}><Logo /></Link>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="grid h-11 w-11 place-items-center rounded-xl hover:bg-muted lg:hidden" aria-label="menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side={lang === "ar" ? "right" : "left"} className="w-80">
            <SheetHeader><SheetTitle><Logo /></SheetTitle></SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">
                  {t.nav[n.key]}
                </Link>
              ))}
              <Link to="/faq" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">{t.nav.faq}</Link>
              <Link to="/delivery" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">{t.nav.delivery}</Link>
              <div className="my-3 h-px bg-border" />
              {staffLike ? (
                <Link to={workspaceTo} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl gradient-brand px-3 py-3 text-sm font-medium text-primary-foreground shadow-glow">
                  <LayoutDashboard className="h-4 w-4" />
                  {isAdmin ? (lang === "ar" ? "لوحة الإدارة" : "Admin workspace") : (lang === "ar" ? "مكتب خدمة العملاء" : "Service desk")}
                </Link>
              ) : user ? (
                <>
                  <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"><User className="h-4 w-4" />{t.nav.account}</Link>
                  <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"><Package className="h-4 w-4" />{t.account.orders}</Link>
                  <Link to="/account/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"><Heart className="h-4 w-4" />{t.nav.wishlist}</Link>
                  <Link to="/notifications" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"><Bell className="h-4 w-4" />{t.customer.notifications}</Link>
                  <Link to="/support" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"><LifeBuoy className="h-4 w-4" />{t.customer.support}</Link>
                  <Link to="/cart" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"><ShoppingBag className="h-4 w-4" />{t.nav.cart}</Link>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setOpen(false)} className="rounded-xl gradient-brand px-3 py-3 text-center text-sm font-medium text-primary-foreground shadow-glow">
                    {t.nav.register}
                  </Link>
                  <Link to="/auth" onClick={() => setOpen(false)} className="rounded-xl border border-border px-3 py-3 text-center text-sm font-medium hover:bg-muted">
                    {t.nav.login}
                  </Link>
                </>
              )}
              <div className="my-3 h-px bg-border" />
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted">
                <Globe className="h-4 w-4" />
                {lang === "ar" ? "English" : "العربية"}
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/"><Logo /></Link>

        <nav className="mx-6 hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {t.nav[n.key]}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ms-auto hidden max-w-xs flex-1 md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "0.75rem" }} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search.placeholder} className="h-10 rounded-full bg-muted/60 ps-9 pe-3 text-sm" />
          </div>
        </form>

        <div className="ms-auto flex items-center gap-1 md:ms-2">
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground/80 hover:bg-muted md:flex">
            <Globe className="h-4 w-4" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
          {customerLike && (
            <>
              <Link to="/notifications" className="relative hidden h-10 w-10 place-items-center rounded-full hover:bg-muted md:grid" aria-label={t.customer.notifications}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">{unreadCount}</span>
                )}
              </Link>
              <Link to="/orders" className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground/80 hover:bg-muted lg:inline-flex" aria-label={t.account.orders}>
                <Package className="h-4 w-4" />
                {t.account.orders}
              </Link>
              <Link to="/account/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label="wishlist">
                <Heart className="h-5 w-5" />
                {wishCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-violet px-1 text-[10px] font-medium text-violet-foreground">{wishCount}</span>
                )}
              </Link>
              <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label="cart">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">{cartCount}</span>
                )}
              </Link>
            </>
          )}
          {staffLike ? (
            <Link to={workspaceTo} className="ms-1 inline-flex h-10 items-center gap-2 rounded-full gradient-brand px-4 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">
              <LayoutDashboard className="h-4 w-4" />
              {isAdmin ? (lang === "ar" ? "لوحة الإدارة" : "Admin") : (lang === "ar" ? "مكتب الخدمة" : "Service desk")}
            </Link>
          ) : user ? (
            <Link to="/account" className={cn("ms-1 hidden h-10 items-center gap-2 rounded-full bg-muted px-4 text-sm font-medium text-foreground hover:bg-muted/80 md:flex")}>
              <User className="h-4 w-4" />
              {t.nav.account}
            </Link>
          ) : (
            <div className="ms-1 hidden items-center gap-2 md:flex">
              <Link to="/auth" className="h-10 items-center rounded-full px-3 text-sm font-medium text-foreground/80 hover:bg-muted inline-flex">
                {t.nav.login}
              </Link>
              <Link to="/auth" className="inline-flex h-10 items-center gap-2 rounded-full gradient-brand px-4 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">
                <UserPlus className="h-4 w-4" />
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
