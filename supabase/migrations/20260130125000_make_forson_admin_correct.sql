-- Migration to make forsonodonkor1211@gmail.com an admin
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from email (corrected email as per user request)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'forsonodonkor1211@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Delete existing role if any
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin');
    
    RAISE NOTICE 'User with email forsonodonkor1211@gmail.com promoted to admin';
  ELSE
    RAISE NOTICE 'User with email forsonodonkor1211@gmail.com not found in auth.users';
  END IF;
END $$;
