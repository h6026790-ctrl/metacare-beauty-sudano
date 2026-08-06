-- 1) Atomic order claiming -------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_order(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_rows integer; v_number text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_staff_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Single conditional UPDATE: a concurrent claim blocks on the row lock and
  -- then sees assigned_staff_id IS NOT NULL, so it affects zero rows.
  UPDATE public.orders
     SET assigned_staff_id = auth.uid()
   WHERE id = _order_id
     AND assigned_staff_id IS NULL
  RETURNING number INTO v_number;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id) THEN
      RAISE EXCEPTION 'order_not_found';
    END IF;
    RAISE EXCEPTION 'order_already_claimed';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'order.claimed', 'order', _order_id::text,
          jsonb_build_object('number', v_number));

  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.claim_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_order(uuid) TO authenticated;

-- 2) Gentle abuse protection for public auth endpoints ----------------------
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only backend (service_role) code touches this table; no anon/authenticated grants.
GRANT ALL ON public.auth_rate_limits TO service_role;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
