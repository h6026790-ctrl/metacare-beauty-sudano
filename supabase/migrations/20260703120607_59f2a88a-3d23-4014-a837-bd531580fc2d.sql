ALTER TABLE public.registration_requests
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Loosen request_type check (kept as free text). Document the accepted values.
COMMENT ON COLUMN public.registration_requests.request_type IS 'register | reset';
COMMENT ON COLUMN public.registration_requests.password_hash IS 'scrypt hash of the password chosen by the customer during registration or password reset. Cleared after verification.';
