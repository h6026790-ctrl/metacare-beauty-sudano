DELETE FROM public.user_roles ur
WHERE ur.role = 'customer'
  AND EXISTS (
    SELECT 1 FROM public.user_roles o
    WHERE o.user_id = ur.user_id AND o.role IN ('admin','staff')
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.phone, '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Manually created admin/staff accounts pass skip_customer_role = true and
  -- must NOT receive the customer role automatically.
  IF COALESCE((NEW.raw_user_meta_data->>'skip_customer_role')::boolean, false) IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $function$;