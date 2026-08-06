-- Visitors browse the catalogue through the security_invoker view
-- public.catalog_public, which reads from public.products. A previous
-- hardening pass revoked ALL anon privileges on products, which also broke
-- the visitor catalogue. Restore column-level SELECT for the non-price
-- columns only; price_sdg / compare_at_sdg stay unreadable by anon.
GRANT SELECT (
  id, slug, name_ar, name_en, description_ar, description_en, image_url,
  brand_id, category_id, is_new, is_best_seller, is_featured, is_pick_of_day,
  is_on_sale, is_available, is_active, created_at, updated_at
) ON public.products TO anon;

REVOKE SELECT (price_sdg, compare_at_sdg) ON public.products FROM anon;