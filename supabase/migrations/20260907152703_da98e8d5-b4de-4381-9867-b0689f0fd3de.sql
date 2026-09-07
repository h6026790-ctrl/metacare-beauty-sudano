ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.profile_change_requests ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_reg_requests_archived_at ON public.registration_requests (archived_at);
CREATE INDEX IF NOT EXISTS idx_pcr_archived_at ON public.profile_change_requests (archived_at);
CREATE INDEX IF NOT EXISTS idx_orders_archived_at ON public.orders (archived_at);

CREATE OR REPLACE FUNCTION public.archive_finished_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total integer := 0;
  c integer;
BEGIN
  UPDATE public.orders o
     SET archived_at = now()
   WHERE o.archived_at IS NULL
     AND o.status IN ('delivered','cancelled','returned')
     AND COALESCE(
           (SELECT max(h.at) FROM public.order_status_history h WHERE h.order_id = o.id),
           o.placed_at
         ) < now() - interval '3 days';
  GET DIAGNOSTICS c = ROW_COUNT; total := total + c;

  UPDATE public.registration_requests r
     SET archived_at = now()
   WHERE r.archived_at IS NULL
     AND r.status IN ('approved','rejected')
     AND COALESCE(r.approved_at, r.rejected_at, r.created_at) < now() - interval '3 days';
  GET DIAGNOSTICS c = ROW_COUNT; total := total + c;

  UPDATE public.profile_change_requests p
     SET archived_at = now()
   WHERE p.archived_at IS NULL
     AND p.status IN ('approved','rejected','expired')
     AND COALESCE(p.reviewed_at, p.updated_at, p.created_at) < now() - interval '3 days';
  GET DIAGNOSTICS c = ROW_COUNT; total := total + c;

  RETURN total;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_finished_records() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_finished_records() FROM anon;
REVOKE ALL ON FUNCTION public.archive_finished_records() FROM authenticated;

SELECT cron.unschedule('archive-finished-records')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'archive-finished-records');

SELECT cron.schedule('archive-finished-records', '17 * * * *', $$SELECT public.archive_finished_records();$$);