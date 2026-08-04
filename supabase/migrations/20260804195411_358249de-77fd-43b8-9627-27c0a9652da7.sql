-- Availability + sale flags on products so the storefront never touches inventory
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS is_on_sale;
ALTER TABLE public.products
  ADD COLUMN is_on_sale boolean
  GENERATED ALWAYS AS (compare_at_sdg IS NOT NULL AND compare_at_sdg > price_sdg) STORED;

UPDATE public.products p
   SET is_available = COALESCE((SELECT i.stock FROM public.inventory i WHERE i.product_id = p.id), 0) > 0;

CREATE OR REPLACE FUNCTION public.sync_product_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.products
     SET is_available = (COALESCE(NEW.stock, 0) > 0)
   WHERE id = NEW.product_id
     AND is_available IS DISTINCT FROM (COALESCE(NEW.stock, 0) > 0);
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.sync_product_availability() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_product_availability ON public.inventory;
CREATE TRIGGER trg_sync_product_availability
AFTER INSERT OR UPDATE OF stock ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.sync_product_availability();

-- Column-level access for visitors: everything except pricing
REVOKE ALL ON public.products FROM anon;
GRANT SELECT (
  id, slug, name_ar, name_en, description_ar, description_en, image_url,
  brand_id, category_id, is_new, is_best_seller, is_featured, is_active,
  is_available, is_on_sale, created_at, updated_at
) ON public.products TO anon;

DROP POLICY IF EXISTS p_products_read_anon ON public.products;
CREATE POLICY p_products_read_anon ON public.products
  FOR SELECT TO anon USING (is_active);

-- Rebuild catalogue feeds as invoker views (no elevated permissions)
DROP VIEW IF EXISTS public.catalog_public;
CREATE VIEW public.catalog_public
WITH (security_invoker = on) AS
SELECT
  p.id, p.slug, p.name_ar, p.name_en, p.description_ar, p.description_en,
  p.image_url, p.brand_id, p.category_id,
  p.is_new, p.is_best_seller, p.is_featured, p.created_at,
  b.slug AS brand_slug, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en,
  c.slug AS category_slug, c.name_ar AS category_name_ar, c.name_en AS category_name_en,
  p.is_on_sale AS has_discount,
  p.is_available AS in_stock
FROM public.products p
LEFT JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id
WHERE p.is_active;

DROP VIEW IF EXISTS public.catalog_authenticated;
CREATE VIEW public.catalog_authenticated
WITH (security_invoker = on) AS
SELECT
  p.id, p.slug, p.name_ar, p.name_en, p.description_ar, p.description_en,
  p.image_url, p.brand_id, p.category_id,
  p.is_new, p.is_best_seller, p.is_featured, p.created_at,
  p.price_sdg, p.compare_at_sdg,
  b.slug AS brand_slug, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en,
  c.slug AS category_slug, c.name_ar AS category_name_ar, c.name_en AS category_name_en,
  p.is_on_sale AS has_discount,
  p.is_available AS in_stock
FROM public.products p
LEFT JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id
WHERE p.is_active;

REVOKE ALL ON public.catalog_public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.catalog_authenticated FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.catalog_public TO anon, authenticated;
GRANT SELECT ON public.catalog_authenticated TO authenticated;
GRANT ALL ON public.catalog_public TO service_role;
GRANT ALL ON public.catalog_authenticated TO service_role;