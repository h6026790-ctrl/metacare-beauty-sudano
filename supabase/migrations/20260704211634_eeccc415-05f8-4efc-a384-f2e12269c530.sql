
DO $$
DECLARE
  v_email text := '249912345678@phone.metacare.local';
  v_phone text := '+249912345678';
  v_password text := '12345678';
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','System Administrator','phone',v_phone,'whatsapp',v_phone),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
            'email', v_email, now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, whatsapp)
  VALUES (v_user_id, 'System Administrator', v_phone, v_phone)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(public.profiles.full_name,''), EXCLUDED.full_name),
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
