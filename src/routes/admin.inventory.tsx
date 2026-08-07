// Inventory workspace — stock, purchase invoices, and movement history.
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { SubNav } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryLayout,
});

function InventoryLayout() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <>
      <SubNav
        items={[
          { to: "/admin/inventory", exact: true, label: ar ? "المخزون الحالي" : "Current stock" },
          { to: "/admin/inventory/purchases", label: ar ? "فواتير الشراء" : "Purchase invoices" },
          { to: "/admin/inventory/movements", label: ar ? "حركة المخزون" : "Movements" },
        ]}
      />
      <Outlet />
    </>
  );
}
