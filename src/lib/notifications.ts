// Customer notifications are derived on the client from the customer's own
// orders — no schema or server-function changes.
import type { OrderStatus } from "@/lib/types";
import type { Lang } from "@/i18n/dict";

export type CustomerNotification = {
  id: string;
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  at: string;
  title: string;
  body: string;
};

const TITLES: Record<OrderStatus, { ar: string; en: string }> = {
  new: { ar: "تم استلام طلبكِ", en: "Order received" },
  review: { ar: "طلبكِ قيد المراجعة", en: "Order under review" },
  paid: { ar: "تم تأكيد الدفع", en: "Payment confirmed" },
  shipping: { ar: "طلبكِ في الطريق", en: "Order on the way" },
  delivered: { ar: "تم تسليم طلبكِ", en: "Order delivered" },
  cancelled: { ar: "تم إلغاء الطلب", en: "Order cancelled" },
  returned: { ar: "تم تسجيل الإرجاع", en: "Return recorded" },
};

const BODIES: Record<OrderStatus, { ar: string; en: string }> = {
  new: { ar: "سنتواصل معكِ عبر واتساب لتأكيد التفاصيل.", en: "We will reach out on WhatsApp to confirm details." },
  review: { ar: "فريقنا يراجع الطلب ويتحقق من التوفر.", en: "Our team is reviewing availability." },
  paid: { ar: "جارٍ تجهيز طلبكِ للشحن.", en: "We are preparing your order for delivery." },
  shipping: { ar: "سيصلكِ الطلب قريباً — تابعي عبر واتساب.", en: "Your order is out for delivery." },
  delivered: { ar: "نتمنى أن تنال المنتجات إعجابكِ.", en: "We hope you love your products." },
  cancelled: { ar: "للاستفسار تواصلي مع خدمة العملاء.", en: "Contact customer service for details." },
  returned: { ar: "تم تسجيل الإرجاع بنجاح.", en: "Your return has been recorded." },
};

export function buildNotifications(orders: any[], lang: Lang): CustomerNotification[] {
  return (orders ?? [])
    .map((o) => {
      const status = o.status as OrderStatus;
      const at = o.updated_at ?? o.placed_at ?? new Date().toISOString();
      return {
        id: `${o.id}:${status}`,
        orderId: o.id as string,
        orderNumber: o.number as string,
        status,
        at,
        title: TITLES[status]?.[lang] ?? status,
        body: BODIES[status]?.[lang] ?? "",
      };
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
