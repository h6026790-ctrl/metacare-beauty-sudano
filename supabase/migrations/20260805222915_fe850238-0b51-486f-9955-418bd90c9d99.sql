-- 1) Site settings (singleton row)
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message_ar text NOT NULL DEFAULT 'المتجر مغلق مؤقتاً، يرجى المحاولة لاحقاً.',
  maintenance_message_en text NOT NULL DEFAULT 'The site is currently unavailable, please try again later.',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id)
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_site_settings_read_anon ON public.site_settings
  FOR SELECT TO anon USING (true);
CREATE POLICY p_site_settings_read_auth ON public.site_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY p_site_settings_admin ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_settings_updated
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id) VALUES (true);

-- 2) Pick of the day flag (at most one product at a time)
ALTER TABLE public.products
  ADD COLUMN is_pick_of_day boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX products_single_pick_of_day
  ON public.products ((is_pick_of_day)) WHERE is_pick_of_day;

-- 3) Rebuild the hardened catalogue feeds with the new flag
DROP VIEW IF EXISTS public.catalog_public;
DROP VIEW IF EXISTS public.catalog_authenticated;

CREATE VIEW public.catalog_public
WITH (security_invoker = on) AS
 SELECT p.id, p.slug, p.name_ar, p.name_en, p.description_ar, p.description_en,
    p.image_url, p.brand_id, p.category_id, p.is_new, p.is_best_seller,
    p.is_featured, p.is_pick_of_day, p.created_at,
    b.slug AS brand_slug, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en,
    c.slug AS category_slug, c.name_ar AS category_name_ar, c.name_en AS category_name_en,
    p.is_on_sale AS has_discount, p.is_available AS in_stock
   FROM public.products p
     LEFT JOIN public.brands b ON b.id = p.brand_id
     LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.is_active;

CREATE VIEW public.catalog_authenticated
WITH (security_invoker = on) AS
 SELECT p.id, p.slug, p.name_ar, p.name_en, p.description_ar, p.description_en,
    p.image_url, p.brand_id, p.category_id, p.is_new, p.is_best_seller,
    p.is_featured, p.is_pick_of_day, p.created_at, p.price_sdg, p.compare_at_sdg,
    b.slug AS brand_slug, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en,
    c.slug AS category_slug, c.name_ar AS category_name_ar, c.name_en AS category_name_en,
    p.is_on_sale AS has_discount, p.is_available AS in_stock
   FROM public.products p
     LEFT JOIN public.brands b ON b.id = p.brand_id
     LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.is_active;

GRANT SELECT ON public.catalog_public TO anon;
GRANT SELECT ON public.catalog_public TO authenticated;
GRANT SELECT ON public.catalog_authenticated TO authenticated;