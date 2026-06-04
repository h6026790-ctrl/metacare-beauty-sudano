import { Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/brand/Logo";
import { Heart, Menu, Search, ShoppingBag, User, X, Globe } from "lucide-react";
import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "home" as const },
  { to: "/products", key: "shop" as const },
  { to: "/categories", key: "categories" as const },
  { to: "/brands", key: "brands" as const },
  { to: "/offers", key: "offers" as const },
] as const;

export function Header() {
  const { t, lang, setLang } = useI18n();
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-muted lg:hidden" aria-label="menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side={lang === "ar" ? "right" : "left"} className="w-80">
            <SheetHeader><SheetTitle><Logo /></SheetTitle></SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {t.nav[n.key]}
                </Link>
              ))}
              <div className="my-3 h-px bg-border" />
              <Link to="/account" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">{t.nav.account}</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">{t.nav.cart}</Link>
              <div className="my-3 h-px bg-border" />
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <Globe className="h-4 w-4" />
                {lang === "ar" ? "English" : "العربية"}
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/"><Logo /></Link>

        <nav className="mx-6 hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
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
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search.placeholder}
              className="h-10 rounded-full bg-muted/60 ps-9 pe-3 text-sm"
            />
          </div>
        </form>

        <div className="ms-auto flex items-center gap-1 md:ms-2">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground/80 hover:bg-muted md:flex"
          >
            <Globe className="h-4 w-4" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <Link to="/account/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label="wishlist">
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-violet px-1 text-[10px] font-medium text-violet-foreground">{wishlist.length}</span>
            )}
          </Link>
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label="cart">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">{cartCount}</span>
            )}
          </Link>
          <Link
            to={user ? "/account" : "/auth"}
            className={cn(
              "ms-1 hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium md:flex",
              user ? "bg-muted text-foreground hover:bg-muted/80" : "gradient-brand text-primary-foreground shadow-glow hover:opacity-95",
            )}
          >
            <User className="h-4 w-4" />
            {user ? user.name.split(" ")[0] : t.nav.login}
          </Link>
        </div>
      </div>
    </header>
  );
}
