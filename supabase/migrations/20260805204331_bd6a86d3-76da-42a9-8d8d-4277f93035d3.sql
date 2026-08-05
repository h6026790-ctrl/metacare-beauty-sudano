-- Deduplicate: keep highest-priority role per user (admin > staff > customer)
DELETE FROM public.user_roles ur
USING (
  SELECT user_id,
         (ARRAY_AGG(id ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'staff' THEN 2 ELSE 3 END))[1] AS keep_id
  FROM public.user_roles GROUP BY user_id
) k
WHERE ur.user_id = k.user_id AND ur.id <> k.keep_id;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

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

  IF COALESCE((NEW.raw_user_meta_data->>'skip_customer_role')::boolean, false) IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  RETURN NEW;
END $function$;