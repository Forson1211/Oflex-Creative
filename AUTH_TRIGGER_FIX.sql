-- FIX FOR: "Database error saving new user"
-- This script makes the user creation trigger more robust and handles potential conflicts.

-- 1. Ensure the app_role enum exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END
$$;

-- 2. Create the robust trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with conflict handling (idempotency)
  -- This prevents errors if a profile somehow already exists
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    -- Handle case where full_name metadata might be missing
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  
  -- Insert default role safely
  -- Using ON CONFLICT logic prevents errors if role already assigned
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the detailed error to Postgres logs (visible in Supabase Dashboard -> Database -> Postgres Logs)
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    -- Re-raise a clean error for the user
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$;

-- 3. Re-bind the trigger to ensure it uses the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verification check (Optional, just to ensure tables exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE EXCEPTION 'The profiles table does not exist. Please run FULL_SETUP.sql first.';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    RAISE EXCEPTION 'The user_roles table does not exist. Please run FULL_SETUP.sql first.';
  END IF;
END
$$;
