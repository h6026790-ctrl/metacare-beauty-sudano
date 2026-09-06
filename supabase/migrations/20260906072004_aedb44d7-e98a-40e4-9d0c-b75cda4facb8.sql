-- 1) Orders can only be created by place_order (SECURITY DEFINER, bypasses RLS)
DROP POLICY IF EXISTS p_orders_owner_insert ON public.orders;
DROP POLICY IF EXISTS p_order_items_insert ON public.order_items;

-- 2) Database-level identity lock on profiles
CREATE OR REPLACE FUNCTION public.enforce_profile_identity_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.full_name IS DISTINCT FROM OLD.full_name)
     OR (NEW.phone IS DISTINCT FROM OLD.phone)
     OR (NEW.whatsapp IS DISTINCT FROM OLD.whatsapp) THEN
    IF current_user IN ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin') THEN
      RETURN NEW;
    END IF;
    IF auth.uid() IS NOT NULL AND public.is_staff_or_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'identity_locked';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.enforce_profile_identity_lock() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_identity_lock ON public.profiles;
CREATE TRIGGER trg_profiles_identity_lock
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_identity_lock();

-- 3) profile_change_requests: customers cannot set internal fields; can cancel own pending
CREATE OR REPLACE FUNCTION public.sanitize_profile_change_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL AND public.is_staff_or_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.status := 'pending';
  NEW.code_hash := NULL;
  NEW.expires_at := NULL;
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  NEW.reject_reason := NULL;
  NEW.failed_attempts := 0;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.sanitize_profile_change_request() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_pcr_sanitize_insert ON public.profile_change_requests;
CREATE TRIGGER trg_pcr_sanitize_insert
BEFORE INSERT ON public.profile_change_requests
FOR EACH ROW EXECUTE FUNCTION public.sanitize_profile_change_request();

DROP POLICY IF EXISTS "Customers cancel own pending request" ON public.profile_change_requests;
CREATE POLICY "Customers cancel own pending request"
ON public.profile_change_requests
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid() AND status = 'pending')
WITH CHECK (profile_id = auth.uid() AND status = 'cancelled');

-- 4) Delivery assignments scoped to admin or the assigned staff member
DROP POLICY IF EXISTS p_da_staff_write ON public.delivery_assignments;
DROP POLICY IF EXISTS p_da_update ON public.delivery_assignments;

CREATE POLICY p_da_staff_write
ON public.delivery_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_assignments.order_id
      AND has_role(auth.uid(), 'staff'::app_role)
      AND o.assigned_staff_id = auth.uid()
  )
);

CREATE POLICY p_da_update
ON public.delivery_assignments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_assignments.order_id
      AND has_role(auth.uid(), 'staff'::app_role)
      AND o.assigned_staff_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_assignments.order_id
      AND has_role(auth.uid(), 'staff'::app_role)
      AND o.assigned_staff_id = auth.uid()
  )
);

-- 5) + 6) Execute privileges on internal / definer functions
REVOKE ALL ON FUNCTION public.log_inventory_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_purchase_invoice(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_purchase_invoice(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.expire_stale_orders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff_or_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.place_order(text, text, text, text, text, text, text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_delivery_by_qr(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;