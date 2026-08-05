CREATE TABLE IF NOT EXISTS public.order_number_counters (
  bucket date PRIMARY KEY,
  last_seq integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.order_number_counters TO service_role;

ALTER TABLE public.order_number_counters ENABLE ROW LEVEL SECURITY;

-- No policies: the table is written only by the SECURITY DEFINER trigger below.

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bucket date := COALESCE(NEW.cutoff_bucket, current_date);
  n integer;
BEGIN
  IF NEW.number IS NULL THEN
    -- Atomic per-day counter: the upsert takes a row lock, so two concurrent
    -- inserts can never be handed the same sequence value.
    INSERT INTO public.order_number_counters AS c (bucket, last_seq)
    VALUES (v_bucket, 1)
    ON CONFLICT (bucket)
    DO UPDATE SET last_seq = c.last_seq + 1, updated_at = now()
    RETURNING c.last_seq INTO n;

    NEW.number := 'MC' || to_char(v_bucket, 'YYMMDD') || '-' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END $function$;

-- Seed counters from existing orders so numbering continues without collisions.
INSERT INTO public.order_number_counters (bucket, last_seq)
SELECT cutoff_bucket, COUNT(*)
FROM public.orders
WHERE cutoff_bucket IS NOT NULL
GROUP BY cutoff_bucket
ON CONFLICT (bucket) DO UPDATE SET last_seq = GREATEST(public.order_number_counters.last_seq, EXCLUDED.last_seq);