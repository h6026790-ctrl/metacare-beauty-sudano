ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_whatsapp text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_url text NOT NULL DEFAULT '';