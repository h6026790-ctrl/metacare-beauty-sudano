import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useWishlist } from "@/lib/api/queries";

/** Mobile tab bar for signed-in customers. Hidden for visitors and on desktop. */
export function CustomerBottomNav() {
  const { t } = useI18n();
  const { user, isStaff } = useAuth();
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();

  if (!user || isStaff) return null;

  const cartCount = (cart?.items ?? []).reduce((s: number, i: any) => s + (i.qty ?? 0), 0);
  const wishCount = wishlist?.length ?? 0;

  const items = [
    { to: "/", label: t.nav.home, icon: Home, exact: true, badge: 0 },
    { to: "/products", label: t.nav.shop, icon: LayoutGrid, exact: false, badge: 0 },
    { to: "/account/wishlist", label: t.nav.wishlist, icon: Heart, exact: false, badge: wishCount },
    { to: "/cart", label: t.nav.cart, icon: ShoppingBag, exact: false, badge: cartCount },
    { to: "/account", label: t.nav.account, icon: User, exact: true, badge: 0 },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t.customer.dashboard}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                activeOptions={{ exact: it.exact }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium"
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{it.label}</span>
                {it.badge > 0 && (
                  <span className="absolute top-1.5 end-[22%] grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                    {it.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
