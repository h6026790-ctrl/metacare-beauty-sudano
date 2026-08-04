import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { OrdersCenter } from "@/components/staff/OrdersCenter";

export const Route = createFileRoute("/staff/orders")({
  head: () => ({
    meta: [
      { title: "مركز الطلبات — خدمة العملاء ميتاكير" },
      { name: "description", content: "معالجة الطلبات: مراجعة، تأكيد الدفع، التسليم للمندوب، والملاحظات الداخلية." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersCenterPage,
});

function OrdersCenterPage() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-foreground">{lang === "ar" ? "مركز الطلبات" : "Orders Center"}</h1>
      <OrdersCenter enabled={!!user && isStaff} />
    </div>
  );
}
