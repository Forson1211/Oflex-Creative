-- ====================================================================
-- FIX: ON CONFLICT constraint error for user_roles
-- ====================================================================
-- This migration fixes the "no unique or exclusion constraint matching 
-- the ON CONFLICT specification" error by ensuring the proper unique
-- constraint exists on user_roles(user_id, role)
-- ====================================================================

-- Drop and recreate the unique constraint with explicit name
DO $$
BEGIN
    -- Drop any existing unique constraints on user_roles (user_id, role)
    -- This handles cases where the constraint exists but has a different name
    DECLARE
        constraint_name TEXT;
    BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'public.user_roles'::regclass 
        AND contype = 'u'
        AND array_length(conkey, 1) = 2;
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.user_roles DROP CONSTRAINT ' || constraint_name;
            RAISE NOTICE 'Dropped existing constraint: %', constraint_name;
        END IF;
    END;
    
    -- Create the constraint with explicit name that matches ON CONFLICT usage
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    
    RAISE NOTICE '✓ Created unique constraint: user_roles_user_id_role_key';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Ensure profiles has unique constraint on user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND conname = 'profiles_user_id_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
        RAISE NOTICE '✓ Created unique constraint: profiles_user_id_key';
    ELSE
        RAISE NOTICE '✓ Constraint profiles_user_id_key already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Profiles constraint error: %', SQLERRM;
END $$;

-- Update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    default_role public.app_role := 'user'::public.app_role;
BEGIN
    -- Insert into profiles with ON CONFLICT
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
    
    -- Insert into user_roles with ON CONFLICT
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, default_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Update the admin_sync_users function
CREATE OR REPLACE FUNCTION public.admin_sync_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  inserted_profiles INTEGER := 0;
  inserted_roles INTEGER := 0;
  caller_role public.app_role;
BEGIN
  -- Check permissions
  SELECT role INTO caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;

  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Moderator access required.';
  END IF;

  -- Sync Profiles
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'full_name', ''),
    COALESCE(u.raw_user_meta_data->>'avatar_url', '')
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS inserted_profiles = ROW_COUNT;

  -- Sync Roles with proper ON CONFLICT
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'user'::public.app_role
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
  ON CONFLICT (user_id, role) DO NOTHING;

  GET DIAGNOSTICS inserted_roles = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'synced_profiles', inserted_profiles,
    'synced_roles', inserted_roles,
    'message', 'Synchronization complete'
  );
END;
$$;

-- Verify constraints
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conname IN ('user_roles_user_id_role_key', 'profiles_user_id_key');
    
    IF constraint_count = 2 THEN
        RAISE NOTICE '✓✓✓ SUCCESS: All required unique constraints are in place';
    ELSE
        RAISE WARNING '⚠ Only % of 2 required constraints found', constraint_count;
    END IF;
END $$;
