REVOKE ALL ON FUNCTION public.audit_registration_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_delivery_by_qr(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_delivery_by_qr(uuid, text) TO authenticated;