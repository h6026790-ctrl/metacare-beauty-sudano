
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.registration_request_status AS ENUM ('pending','approved','rejected','verified','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text NOT NULL,
  address_state_id uuid REFERENCES public.states(id),
  address_city_id uuid REFERENCES public.cities(id),
  address_neighborhood_id uuid REFERENCES public.neighborhoods(id),
  street text,
  notes text,
  otp_code text NOT NULL,
  status public.registration_request_status NOT NULL DEFAULT 'pending',
  request_type text NOT NULL DEFAULT 'register',
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  rejected_at timestamptz,
  rejected_by uuid,
  reject_reason text,
  verified_at timestamptz,
  user_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS registration_requests_phone_idx ON public.registration_requests (phone);
CREATE INDEX IF NOT EXISTS registration_requests_status_idx ON public.registration_requests (status, created_at DESC);

-- Grants: only authenticated staff read/update; no anon. Server fns use service_role.
GRANT SELECT, INSERT, UPDATE ON public.registration_requests TO authenticated;
GRANT ALL ON public.registration_requests TO service_role;

ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- RLS: only staff/admin can read or update
DROP POLICY IF EXISTS "staff read registration requests" ON public.registration_requests;
CREATE POLICY "staff read registration requests"
  ON public.registration_requests FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "staff update registration requests" ON public.registration_requests;
CREATE POLICY "staff update registration requests"
  ON public.registration_requests FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- Audit trigger for registration requests
CREATE OR REPLACE FUNCTION public.audit_registration_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'registration.otp_generated';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_action := CASE NEW.status
      WHEN 'approved' THEN 'registration.approved'
      WHEN 'rejected' THEN 'registration.rejected'
      WHEN 'verified' THEN 'registration.verified'
      WHEN 'expired' THEN 'registration.expired'
      ELSE 'registration.status_changed' END;
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), v_action, 'registration_request', NEW.id::text,
          jsonb_build_object('phone', NEW.phone, 'status', NEW.status));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_registration_request ON public.registration_requests;
CREATE TRIGGER trg_audit_registration_request
  AFTER INSERT OR UPDATE ON public.registration_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_registration_request();
