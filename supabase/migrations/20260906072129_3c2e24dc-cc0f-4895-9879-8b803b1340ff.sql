-- The previous versions ran as SECURITY DEFINER, which made current_user always
-- resolve to the function owner, so the guards never triggered. Switch to
-- SECURITY INVOKER so the executing role is evaluated correctly.
CREATE OR REPLACE FUNCTION public.enforce_profile_identity_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

CREATE OR REPLACE FUNCTION public.sanitize_profile_change_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE ALL ON FUNCTION public.enforce_profile_identity_lock() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sanitize_profile_change_request() FROM PUBLIC, anon;