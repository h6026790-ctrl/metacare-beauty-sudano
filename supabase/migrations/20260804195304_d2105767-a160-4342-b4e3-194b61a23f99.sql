-- ============================================================
-- Phase 2 production hardening: price + inventory protection,
-- removal of anonymous role-check execution.
-- ============================================================

-- 1. Public catalogue feed (NO prices, NO quantities)
DROP VIEW IF EXISTS public.catalog_public;
CREATE VIEW public.catalog_public AS
SELECT
  p.id, p.slug, p.name_ar, p.name_en, p.description_ar, p.description_en,
  p.image_url, p.brand_id, p.category_id,
  p.is_new, p.is_best_seller, p.is_featured, p.created_at,
  b.slug AS brand_slug, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en,
  c.slug AS category_slug, c.name_ar AS category_name_ar, c.name_en AS category_name_en,
  (p.compare_at_sdg IS NOT NULL AND p.compare_at_sdg > p.price_sdg) AS has_discount,
  (COALESCE(i.stock, 0) > 0) AS in_stock
FROM public.products p
LEFT JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.inventory i ON i.product_id = p.id
WHERE p.is_active;

-- 2. Signed-in catalogue feed (prices included, still NO quantities)
DROP VIEW IF EXISTS public.catalog_authenticated;
CREATE VIEW public.catalog_authenticated AS
SELECT
  p.id, p.slug, p.name_ar, p.name_en, p.description_ar, p.description_en,
  p.image_url, p.brand_id, p.category_id,
  p.is_new, p.is_best_seller, p.is_featured, p.created_at,
  p.price_sdg, p.compare_at_sdg,
  b.slug AS brand_slug, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en,
  c.slug AS category_slug, c.name_ar AS category_name_ar, c.name_en AS category_name_en,
  (p.compare_at_sdg IS NOT NULL AND p.compare_at_sdg > p.price_sdg) AS has_discount,
  (COALESCE(i.stock, 0) > 0) AS in_stock
FROM public.products p
LEFT JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.inventory i ON i.product_id = p.id
WHERE p.is_active;

REVOKE ALL ON public.catalog_public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.catalog_authenticated FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.catalog_public TO anon, authenticated;
GRANT SELECT ON public.catalog_authenticated TO authenticated;
GRANT ALL ON public.catalog_public TO service_role;
GRANT ALL ON public.catalog_authenticated TO service_role;

-- 3. products: no anonymous access at all (prices live here)
DROP POLICY IF EXISTS p_products_read ON public.products;
CREATE POLICY p_products_read_auth ON public.products
  FOR SELECT TO authenticated
  USING (is_active OR public.is_staff_or_admin(auth.uid()));
REVOKE ALL ON public.products FROM anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- 4. inventory: quantities visible to staff/admin only
DROP POLICY IF EXISTS p_inventory_read ON public.inventory;
CREATE POLICY p_inventory_read_staff ON public.inventory
  FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));
REVOKE ALL ON public.inventory FROM anon;
GRANT SELECT ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;

-- 5. Split mixed public policies into anon / authenticated variants
DROP POLICY IF EXISTS p_pimages_read ON public.product_images;
CREATE POLICY p_pimages_read_anon ON public.product_images
  FOR SELECT TO anon USING (true);
CREATE POLICY p_pimages_read_auth ON public.product_images
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_brands_read ON public.brands;
CREATE POLICY p_brands_read_anon ON public.brands
  FOR SELECT TO anon USING (is_active);
CREATE POLICY p_brands_read_auth ON public.brands
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS p_categories_read ON public.categories;
CREATE POLICY p_categories_read_anon ON public.categories
  FOR SELECT TO anon USING (is_active);
CREATE POLICY p_categories_read_auth ON public.categories
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS p_states_read ON public.states;
CREATE POLICY p_states_read_anon ON public.states
  FOR SELECT TO anon USING (is_active);
CREATE POLICY p_states_read_auth ON public.states
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS p_cities_read ON public.cities;
CREATE POLICY p_cities_read_anon ON public.cities
  FOR SELECT TO anon USING (is_active);
CREATE POLICY p_cities_read_auth ON public.cities
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS p_neigh_read ON public.neighborhoods;
CREATE POLICY p_neigh_read_anon ON public.neighborhoods
  FOR SELECT TO anon USING (is_active);
CREATE POLICY p_neigh_read_auth ON public.neighborhoods
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

-- 6. Remove the anonymous role-check oracle
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff_or_admin(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_or_admin(uuid) TO authenticated, service_role;