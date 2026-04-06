-- ============================================
-- ADMIN USER SETUP SCRIPT
-- ============================================
-- Run this in your Supabase SQL Editor to make your current user an admin
-- URL: https://rilcytjdydirhhtbrwet.supabase.co/project/rilcytjdydirhhtbrwet/sql

-- Option 1: Make a specific user (by email) an admin
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'forsonodonkor1211@gmail.com'; -- CHANGE THIS TO YOUR EMAIL
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with that email not found';
  END IF;
  
  -- Delete existing role if any
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');
  
  RAISE NOTICE 'User % is now an admin', v_user_id;
END $$;

-- ============================================
-- OR Option 2: Make the FIRST user in the system an admin
-- ============================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first user
  SELECT id INTO v_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the system';
  END IF;
  
  -- Delete existing role if any
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');
  
  RAISE NOTICE 'First user % is now an admin', v_user_id;
END $$;

-- ============================================
-- Option 3: View all users and their roles
-- ============================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  COALESCE(ur.role, 'user') as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at ASC;

-- ============================================
-- Option 4: Make ALL existing users admins (use with caution!)
-- ============================================
-- Uncomment to run:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public.user_roles)
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
