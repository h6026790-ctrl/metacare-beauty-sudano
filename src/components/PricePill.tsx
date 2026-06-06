import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { formatPrice } from "@/lib/format";

export function PricePill({ price, compareAt, size = "md" }: { price: number; compareAt?: number | null; size?: "sm" | "md" | "lg" }) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const sz = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";

  if (!user) {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : "default"}
        className="h-auto gap-1.5 rounded-full border border-dashed border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate({ to: "/auth" }); }}
      >
        <Lock className="h-3 w-3" />
        {t.product.loginToSee}
      </Button>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-display font-semibold text-foreground ${sz}`}>{formatPrice(price, lang)}</span>
      {compareAt && compareAt > price && (
        <span className="text-xs text-muted-foreground line-through">{formatPrice(compareAt, lang)}</span>
      )}
    </div>
  );
}
