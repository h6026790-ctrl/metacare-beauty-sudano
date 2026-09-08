CREATE OR REPLACE FUNCTION public.archive_finished_records()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
     AND p.status IN ('approved','applied','rejected','expired','cancelled')
     AND COALESCE(p.reviewed_at, p.updated_at, p.created_at) < now() - interval '3 days';
  GET DIAGNOSTICS c = ROW_COUNT; total := total + c;

  RETURN total;
END;
$function$;