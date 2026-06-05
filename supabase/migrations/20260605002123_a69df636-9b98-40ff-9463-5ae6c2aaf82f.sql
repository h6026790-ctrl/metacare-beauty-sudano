
-- Lock down trigger / internal security-definer functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_product_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_inventory_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_delivery_assignment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Brands
INSERT INTO public.brands (slug, name_ar, name_en, tagline_ar, tagline_en, sort_order) VALUES
  ('lumeil','لوميل','Lumeil','نقاء فرنسي','French purity',1),
  ('aurelia','أوريليا','Aurelia','ذهب الطبيعة','Nature''s gold',2),
  ('nordique','نورديك','Nordique','نقاء اسكندنافي','Nordic clarity',3),
  ('seraph','سيرَف','Seraph','رفاهية بسيطة','Quiet luxury',4),
  ('soleil','سولاي','Soleil','إشراقة شمسية','Sun-kissed glow',5),
  ('verdance','فيردانس','Verdance','نباتي خالص','Pure botanical',6),
  ('atelier','أتولييه','Atelier Beauté','حرفية فاخرة','Artisan luxury',7),
  ('orient','أوريانت','Orient Rose','عطور الشرق','Eastern essence',8);

-- Products (sample — 12 items across categories)
WITH b AS (SELECT slug, id FROM public.brands), c AS (SELECT slug, id FROM public.categories)
INSERT INTO public.products (slug, brand_id, category_id, name_ar, name_en, description_ar, description_en, price_sdg, compare_at_sdg, is_featured, is_new, is_best_seller)
SELECT * FROM (VALUES
  ('lumeil-radiance-serum', (SELECT id FROM b WHERE slug='lumeil'), (SELECT id FROM c WHERE slug='skincare'),
    'سيروم النضارة المركّز','Radiance Concentrate Serum',
    'سيروم خفيف يمنح البشرة إشراقاً صحياً ويوحّد لونها.',
    'Lightweight serum that delivers a healthy, even glow.', 145000, 175000, true, true, true),
  ('aurelia-gold-cream', (SELECT id FROM b WHERE slug='aurelia'), (SELECT id FROM c WHERE slug='skincare'),
    'كريم الذهب المرطّب','Gold Hydration Cream',
    'كريم مرطّب فاخر بخلاصة الذهب لبشرة ناعمة ومشرقة.',
    'Luxurious gold-infused moisturizer for soft, luminous skin.', 220000, NULL, true, false, true),
  ('nordique-sunshield-50', (SELECT id FROM b WHERE slug='nordique'), (SELECT id FROM c WHERE slug='skincare'),
    'واقي الشمس اليومي SPF 50','Daily Sunshield SPF 50',
    'حماية يومية خفيفة بلمسة نهائية مخملية.','Daily lightweight protection with a velvet finish.',
    95000, NULL, false, true, false),
  ('seraph-velvet-lip', (SELECT id FROM b WHERE slug='seraph'), (SELECT id FROM c WHERE slug='makeup'),
    'أحمر شفاه مخملي','Velvet Matte Lipstick',
    'تركيبة مخملية مريحة تدوم طويلاً.','Long-wear velvet matte that stays comfortable.',
    65000, 80000, true, false, true),
  ('soleil-glow-blush', (SELECT id FROM b WHERE slug='soleil'), (SELECT id FROM c WHERE slug='makeup'),
    'بلاشر إشراقة الشمس','Sun-Kissed Glow Blush',
    'إشراقة طبيعية تدوم ساعات.','Natural radiance that lasts.',
    58000, NULL, false, true, false),
  ('seraph-volume-mascara', (SELECT id FROM b WHERE slug='seraph'), (SELECT id FROM c WHERE slug='makeup'),
    'ماسكارا الحجم الفائق','Ultra-Volume Mascara',
    'حجم فوري وكثافة دون تكتل.','Instant volume, no clumping.',
    72000, NULL, true, false, true),
  ('orient-rose-eau', (SELECT id FROM b WHERE slug='orient'), (SELECT id FROM c WHERE slug='fragrance'),
    'أو دو بارفان وردة الشرق','Rose d''Orient Eau de Parfum',
    'مزيج وردي شرقي فاخر بقاعدة عنبر.','A luxurious oriental rose with amber base.',
    310000, 360000, true, true, false),
  ('atelier-amber-noir', (SELECT id FROM b WHERE slug='atelier'), (SELECT id FROM c WHERE slug='fragrance'),
    'عطر العنبر الأسود','Amber Noir Parfum',
    'دافئ وغامض، يبقى طوال اليوم.','Warm, mysterious, all-day wear.', 380000, NULL, true, false, true),
  ('verdance-body-elixir', (SELECT id FROM b WHERE slug='verdance'), (SELECT id FROM c WHERE slug='bodycare'),
    'إكسير الجسم النباتي','Botanical Body Elixir',
    'زيت مغذٍّ يترك البشرة حريرية.','Nourishing oil that leaves skin silky.', 88000, NULL, false, true, false),
  ('verdance-bloom-lotion', (SELECT id FROM b WHERE slug='verdance'), (SELECT id FROM c WHERE slug='bodycare'),
    'لوشن إزهار الجسم','Bloom Body Lotion',
    'ترطيب يومي بعطر زهري ناعم.','Daily hydration with a soft floral scent.', 54000, 68000, false, false, true),
  ('lumeil-night-renewal', (SELECT id FROM b WHERE slug='lumeil'), (SELECT id FROM c WHERE slug='skincare'),
    'كريم التجديد الليلي','Night Renewal Cream',
    'يعمل أثناء الليل لتجديد البشرة.','Works overnight to renew skin.', 165000, NULL, true, false, false),
  ('aurelia-eye-radiance', (SELECT id FROM b WHERE slug='aurelia'), (SELECT id FROM c WHERE slug='skincare'),
    'كريم العين المضيء','Eye Radiance Cream',
    'يقلل الهالات ويوحّد محيط العين.','Reduces darkness around the eyes.', 125000, NULL, false, true, true)
) AS v;

-- Inventory: stock 25 per product (one product out of stock for testing)
INSERT INTO public.inventory (product_id, stock)
SELECT id, CASE WHEN slug='soleil-glow-blush' THEN 0 ELSE 25 END FROM public.products;
