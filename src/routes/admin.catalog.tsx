// Catalogue workspace — products & brands, and category administration.
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { SubNav } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/catalog")({
  component: CatalogLayout,
});

function CatalogLayout() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <>
      <SubNav
        items={[
          { to: "/admin/catalog", exact: true, label: ar ? "المنتجات والعلامات" : "Products & brands" },
          { to: "/admin/catalog/categories", label: ar ? "التصنيفات" : "Categories" },
        ]}
      />
      <Outlet />
    </>
  );
}
