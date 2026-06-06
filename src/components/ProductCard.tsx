import { Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCart, useToggleWishlist, useWishlist, type UIProduct } from "@/lib/api/queries";
import { PricePill } from "./PricePill";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: UIProduct; index?: number }) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: wishlist } = useWishlist();
  const toggleWish = useToggleWishlist();
  const addToCart = useAddToCart();
  const isWished = !!wishlist?.some((w: any) => w.product?.id === product.id);
  const oos = !product.inStock;

  const requireAuth = () => { if (!user) { navigate({ to: "/auth" }); return false; } return true; };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to="/products/$id"
        params={{ id: product.slug }}
        className="group block overflow-hidden rounded-2xl bg-card shadow-glass ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
      >
        <div className="relative aspect-square overflow-hidden gradient-aurora">
          <img
            src={product.image}
            alt={product.name[lang]}
            loading="lazy"
            className={cn("h-full w-full object-cover transition-transform duration-700 group-hover:scale-105", oos && "opacity-60 grayscale")}
          />
          <div className="absolute start-3 top-3 flex flex-col gap-1.5">
            {product.isNew && <span className="rounded-full bg-accent/95 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground shadow-glass">{lang === "ar" ? "جديد" : "NEW"}</span>}
            {product.compareAt && !oos && <span className="rounded-full bg-violet/95 px-2.5 py-0.5 text-[10px] font-medium text-violet-foreground shadow-glass">{lang === "ar" ? "عرض" : "SALE"}</span>}
          </div>
          {oos && (
            <div className="absolute inset-x-0 bottom-0 bg-background/85 px-3 py-1.5 text-center text-xs font-medium text-foreground backdrop-blur">
              {t.product.outOfStock}
            </div>
          )}
          <button
            type="button"
            aria-label={isWished ? t.product.removeFromWishlist : t.product.addToWishlist}
            onClick={(e) => { e.preventDefault(); if (!requireAuth()) return; toggleWish.mutate(product.id); }}
            className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/85 text-foreground shadow-glass backdrop-blur transition hover:bg-card"
          >
            <Heart className={cn("h-4 w-4 transition", isWished && "fill-violet text-violet")} />
          </button>
        </div>

        <div className="space-y-2 p-4">
          {product.brand && <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{product.brand.name[lang]}</p>}
          <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name[lang]}</h3>
          <div className="flex items-end justify-between pt-1">
            <PricePill price={product.price} compareAt={product.compareAt} size="sm" />
            {!oos && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!requireAuth()) return;
                  addToCart.mutate(product.id, {
                    onSuccess: () => toast.success(t.product.added),
                  });
                }}
                className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground transition hover:opacity-90"
              >
                {t.product.addToCart}
              </button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
