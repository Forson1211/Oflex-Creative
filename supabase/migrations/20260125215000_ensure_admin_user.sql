-- Ensure there's at least one admin user
-- This migration will make the first user in the system an admin if no admin exists

DO $$
DECLARE
  v_user_id uuid;
  v_admin_count integer;
BEGIN
  -- Check if there are any admins
  SELECT COUNT(*) INTO v_admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  -- If no admins exist, make the first user an admin
  IF v_admin_count = 0 THEN
    -- Get the first user from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;

    -- If a user exists, make them admin
    IF v_user_id IS NOT NULL THEN
      -- Check if they already have a role entry
      IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
        -- Update existing role to admin
        UPDATE public.user_roles
        SET role = 'admin'
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Updated user % to admin role', v_user_id;
      ELSE
        -- Insert new admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin');
        
        RAISE NOTICE 'Created admin role for user %', v_user_id;
      END IF;
    ELSE
      RAISE NOTICE 'No users found in the system';
    END IF;
  ELSE
    RAISE NOTICE 'Admin users already exist (count: %)', v_admin_count;
  END IF;
END $$;
