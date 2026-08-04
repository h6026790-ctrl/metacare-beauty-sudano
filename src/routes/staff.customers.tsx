// Customer Center — lookup built from the orders this employee already handles.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { useStaffOrders } from "@/components/staff/useStaffWorkspace";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { formatPrice, whatsappLink } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/staff/customers")({
  head: () => ({
    meta: [
      { title: "مركز العملاء — خدمة العملاء ميتاكير" },
      { name: "description", content: "البحث عن العميلات وعرض بياناتهن وسجل طلباتهن والتواصل معهن مباشرة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersCenter,
});

function CustomersCenter() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const ordersQ = useStaffOrders(!!user && isStaff);
  const orders = (ordersQ.data ?? []) as any[];

  const customers = useMemo(() => {
    const map = new Map<string, any>();
    for (const o of orders) {
      const key = o.contact_phone ?? o.profile_id ?? o.id;
      const cur = map.get(key) ?? {
        key,
        name: o.contact_name,
        phone: o.contact_phone,
        whatsapp: o.contact_whatsapp ?? o.contact_phone,
        address: [o.address_neighborhood, o.address_street, o.address_city].filter(Boolean).join(", "),
        orders: [] as any[],
        total: 0,
      };
      cur.orders.push(o);
      cur.total += Number(o.total_sdg ?? 0);
      map.set(key, cur);
    }
    const term = q.trim().toLowerCase();
    return Array.from(map.values()).filter(
      (c) => !term || (c.name ?? "").toLowerCase().includes(term) || (c.phone ?? "").includes(term),
    );
  }, [orders, q]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-foreground">{lang === "ar" ? "مركز العملاء" : "Customer Center"}</h1>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "0.75rem" }} />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "ar" ? "بحث بالاسم أو رقم الهاتف" : "Search by name or phone"}
          className="h-9 rounded-full bg-muted/60 ps-9 text-xs"
        />
      </div>

      <div className="grid gap-3">
        {customers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {lang === "ar" ? "لا توجد عميلات مطابقات" : "No matching customers"}
          </div>
        )}
        {customers.map((c) => (
          <div key={c.key} className="rounded-2xl border border-border bg-card p-4 shadow-glass">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
                {c.address && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary" />{c.address}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {c.orders.length} {lang === "ar" ? "طلب" : "orders"} • {formatPrice(c.total, lang)}
                </span>
                <a href={whatsappLink(c.whatsapp, `مرحباً ${c.name}،`)} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-medium text-success-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />{lang === "ar" ? "واتساب" : "WhatsApp"}
                </a>
                <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" />{lang === "ar" ? "اتصال" : "Call"}
                </a>
                <button onClick={() => setOpenId(openId === c.key ? null : c.key)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                  {lang === "ar" ? "سجل الطلبات" : "Order history"}
                </button>
              </div>
            </div>

            {openId === c.key && (
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                {c.orders.map((o: any) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 p-3 text-xs">
                    <span className="font-mono text-foreground">{o.number}</span>
                    <span className="text-muted-foreground">
                      {o.placed_at ? new Date(o.placed_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : "—"}
                    </span>
                    <span className="text-muted-foreground">{formatPrice(Number(o.total_sdg), lang)}</span>
                    <OrderStatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
