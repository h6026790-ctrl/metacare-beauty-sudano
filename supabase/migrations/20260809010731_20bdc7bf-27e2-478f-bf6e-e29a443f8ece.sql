ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hours_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hours_en text NOT NULL DEFAULT '';

UPDATE public.site_settings SET
  contact_phone = COALESCE(NULLIF(contact_phone, ''), '+249 99 337 3874'),
  contact_email = COALESCE(NULLIF(contact_email, ''), 'care@metacare.sd'),
  address_ar = COALESCE(NULLIF(address_ar, ''), 'ود مدني، الجزيرة، السودان'),
  address_en = COALESCE(NULLIF(address_en, ''), 'Wad Madani, Gezira, Sudan'),
  hours_ar = COALESCE(NULLIF(hours_ar, ''), 'السبت – الخميس، ٩ ص – ٩ م'),
  hours_en = COALESCE(NULLIF(hours_en, ''), 'Sat – Thu, 9 AM – 9 PM')
WHERE id = true;