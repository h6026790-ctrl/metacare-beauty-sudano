import { Check, Clock, Package, Truck, Sparkles, XCircle, RotateCcw } from "lucide-react";
import { ORDER_STATUS_FLOW, type OrderStatus } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

const ICONS: Record<OrderStatus, typeof Check> = {
  new: Sparkles,
  review: Clock,
  paid: Check,
  shipping: Truck,
  delivered: Package,
  cancelled: XCircle,
  returned: RotateCcw,
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const Icon = ICONS[status];
  const tone = status === "cancelled"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : status === "delivered"
    ? "bg-success/10 text-success border-success/20"
    : status === "shipping"
    ? "bg-accent/15 text-foreground border-accent/30"
    : status === "paid"
    ? "bg-primary/10 text-primary border-primary/20"
    : status === "returned"
    ? "bg-warning/15 text-foreground border-warning/30"
    : "bg-muted text-foreground border-border";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", tone)}>
      <Icon className="h-3.5 w-3.5" />
      {t.status[status]}
    </span>
  );
}

export function OrderTimeline({ status, history }: { status: OrderStatus; history: { status: OrderStatus; at: string }[] }) {
  const { t } = useI18n();
  const currentIdx = ORDER_STATUS_FLOW.indexOf(status);
  const isTerminalBad = status === "cancelled" || status === "returned";

  return (
    <div className="space-y-4">
      <ol className="relative">
        {ORDER_STATUS_FLOW.map((s, i) => {
          const Icon = ICONS[s];
          const reached = !isTerminalBad && i <= currentIdx;
          const isCurrent = !isTerminalBad && i === currentIdx;
          const histEntry = history.find((h) => h.status === s);
          return (
            <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
              {i < ORDER_STATUS_FLOW.length - 1 && (
                <span
                  className={cn(
                    "absolute top-9 h-[calc(100%-1.25rem)] w-px",
                    reached ? "bg-gradient-to-b from-accent to-primary" : "bg-border",
                  )}
                  style={{ insetInlineStart: "1.125rem" }}
                />
              )}
              <span
                className={cn(
                  "z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all",
                  reached
                    ? "border-transparent gradient-brand text-primary-foreground shadow-glow"
                    : "border-border bg-card text-muted-foreground",
                  isCurrent && "ring-4 ring-accent/20",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1 pt-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className={cn("text-sm font-medium", reached ? "text-foreground" : "text-muted-foreground")}>
                    {t.status[s]}
                  </p>
                  {histEntry && (
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(histEntry.at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {isTerminalBad && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {t.status[status]}
        </div>
      )}
    </div>
  );
}
