CREATE TABLE public.profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_name text,
  requested_name text,
  current_phone text,
  requested_phone text,
  status text NOT NULL DEFAULT 'pending',
  code_hash text,
  failed_attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.profile_change_requests TO authenticated;
GRANT UPDATE ON public.profile_change_requests TO authenticated;
GRANT ALL ON public.profile_change_requests TO service_role;

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own change requests"
  ON public.profile_change_requests FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Customers create own change requests"
  ON public.profile_change_requests FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() AND status = 'pending');

CREATE POLICY "Staff read all change requests"
  ON public.profile_change_requests FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff update change requests"
  ON public.profile_change_requests FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE INDEX idx_pcr_profile ON public.profile_change_requests (profile_id, created_at DESC);
CREATE INDEX idx_pcr_status ON public.profile_change_requests (status);

CREATE TRIGGER trg_pcr_updated
  BEFORE UPDATE ON public.profile_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();