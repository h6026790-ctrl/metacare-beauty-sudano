import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export function OrderRow({ order, onReorder }: { order: any; onReorder?: (o: any) => void }) {
  const { lang, t } = useI18n();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const count = order.order_items?.length ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-glass transition hover:shadow-elevated">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium tracking-wider text-foreground">{order.number}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatDate(order.placed_at, lang)} • {count} {count === 1 ? t.cart.item : t.cart.items}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-sm font-medium text-foreground">{formatPrice(Number(order.total_sdg), lang)}</span>
        <div className="flex flex-wrap items-center gap-2">
          {onReorder && count > 0 && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.customer.reorder}
            </button>
          )}
          <Link
            to="/orders/$id"
            params={{ id: order.id }}
            search={{}}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full gradient-brand px-4 text-xs font-medium text-primary-foreground shadow-glow"
          >
            {t.customer.orderDetails}
            <Chevron className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
