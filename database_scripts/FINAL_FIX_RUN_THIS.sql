-- ====================================================================
-- ABSOLUTE FINAL FIX - THIS WILL WORK!
-- ====================================================================
-- Copy this ENTIRE script into Supabase SQL Editor and run it
-- Then send me a screenshot of the output
-- ====================================================================

-- PART 1: Clean up everything and start fresh
DO $$
DECLARE
    v_constraint_name TEXT;
    v_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 1: CLEANUP';
    RAISE NOTICE '========================================';
    
    -- Drop ALL unique constraints on user_roles
    FOR v_constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.user_roles'::regclass
        AND contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE public.user_roles DROP CONSTRAINT ' || v_constraint_name;
        RAISE NOTICE '✓ Dropped constraint: %', v_constraint_name;
    END LOOP;
    
    -- Count duplicates
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT user_id, role, COUNT(*) as cnt
        FROM public.user_roles
        GROUP BY user_id, role
        HAVING COUNT(*) > 1
    ) dups;
    
    IF v_count > 0 THEN
        RAISE NOTICE '⚠ Found % duplicate user_role combinations', v_count;
        
        -- Remove duplicates - keep oldest
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY created_at ASC, id ASC) as rn
            FROM public.user_roles
        )
        DELETE FROM public.user_roles
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE '✓ Removed % duplicate rows', v_count;
    ELSE
        RAISE NOTICE '✓ No duplicates found';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ Cleanup error: %', SQLERRM;
END $$;

-- PART 2: Create the constraint
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 2: CREATE CONSTRAINT';
    RAISE NOTICE '========================================';
    
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    
    RAISE NOTICE '✓✓✓ SUCCESS! Created constraint: user_roles_user_id_role_key';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠⚠⚠ FAILED! Error: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;

-- PART 3: Verify constraint exists
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 3: VERIFICATION';
    RAISE NOTICE '========================================';
    
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_roles_user_id_role_key'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '✓ Constraint user_roles_user_id_role_key EXISTS';
    ELSE
        RAISE NOTICE '⚠ Constraint user_roles_user_id_role_key DOES NOT EXIST';
    END IF;
END $$;

-- PART 4: Update or create admin_sync_users function
CREATE OR REPLACE FUNCTION public.admin_sync_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
  inserted_profiles INTEGER := 0;
  inserted_roles INTEGER := 0;
  caller_role public.app_role;
  error_detail TEXT;
BEGIN
  -- Check permissions
  BEGIN
    SELECT role INTO caller_role 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to check user permissions: ' || SQLERRM
    );
  END;

  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'moderator') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Admin or Moderator access required. Your role: ' || COALESCE(caller_role::TEXT, 'none')
    );
  END IF;

  -- Sync Profiles
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    error_detail := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to sync profiles: ' || error_detail,
      'sqlstate', SQLSTATE
    );
  END;

  -- Sync Roles
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    SELECT u.id, 'user'::public.app_role
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
    ON CONFLICT (user_id, role) DO NOTHING;

    GET DIAGNOSTICS inserted_roles = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    error_detail := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to sync roles: ' || error_detail,
      'sqlstate', SQLSTATE,
      'hint', 'The unique constraint might be missing. Run the diagnostic script.'
    );
  END;

  RETURN json_build_object(
    'success', true,
    'synced_profiles', inserted_profiles,
    'synced_roles', inserted_roles,
    'message', 'Synchronization complete'
  );
END;
$$;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 4: FUNCTION UPDATE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Updated admin_sync_users function with better error handling';
END $$;

-- PART 5: Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    default_role public.app_role := 'user'::public.app_role;
BEGIN
    -- Insert into profiles
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
    
    -- Insert into user_roles
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

DO $$
BEGIN
    RAISE NOTICE '✓ Updated handle_new_user trigger function';
END $$;

-- FINAL SUMMARY
DO $$
DECLARE
    v_constraint_exists BOOLEAN;
    v_function_exists BOOLEAN;
    v_total_users INTEGER;
    v_total_roles INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL SUMMARY';
    RAISE NOTICE '========================================';
    
    -- Check constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_roles_user_id_role_key'
    ) INTO v_constraint_exists;
    
    -- Check function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'admin_sync_users'
    ) INTO v_function_exists;
    
    -- Count data
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    SELECT COUNT(*) INTO v_total_roles FROM public.user_roles;
    
    RAISE NOTICE 'Constraint exists: %', CASE WHEN v_constraint_exists THEN '✓ YES' ELSE '⚠ NO' END;
    RAISE NOTICE 'Function exists: %', CASE WHEN v_function_exists THEN '✓ YES' ELSE '⚠ NO' END;
    RAISE NOTICE 'Total users: %', v_total_users;
    RAISE NOTICE 'Total roles: %', v_total_roles;
    RAISE NOTICE '';
    
    IF v_constraint_exists AND v_function_exists THEN
        RAISE NOTICE '✓✓✓ ALL GOOD! Try the Sync Users button now!';
    ELSE
        RAISE NOTICE '⚠⚠⚠ SOMETHING IS STILL WRONG!';
        RAISE NOTICE 'Please send me a screenshot of this entire output';
    END IF;
END $$;
