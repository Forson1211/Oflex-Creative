-- Migration to make forsonodonkor121@gmail.com an admin
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'forsonodonkor121@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Delete existing role if any to be clean
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin');
  END IF;
END $$;
