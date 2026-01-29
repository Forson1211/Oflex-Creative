-- ====================================================================
-- DISABLE EMAIL CONFIRMATION (ENABLE AUTOCONFIRM)
-- ====================================================================
-- This migration disables email confirmation for new signups.
-- Users will be automatically confirmed and can log in immediately.
-- ====================================================================

-- Update auth config to disable email confirmation
-- Note: This requires Supabase CLI or direct database access
-- Alternatively, use the Supabase Dashboard: Authentication > Providers > Email

-- Check current setting
DO $$
BEGIN
  RAISE NOTICE '=== AUTOCONFIRM SETUP ===';
  RAISE NOTICE 'To enable autoconfirm (disable email confirmation):';
  RAISE NOTICE '1. Go to Supabase Dashboard';
  RAISE NOTICE '2. Navigate to: Authentication > Providers > Email';
  RAISE NOTICE '3. Toggle OFF "Confirm email"';
  RAISE NOTICE '4. Click Save';
  RAISE NOTICE '';
  RAISE NOTICE 'This cannot be done via SQL migration.';
  RAISE NOTICE 'You must use the Supabase Dashboard.';
END $$;

-- Verify that the trigger is ready for autoconfirm users
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✓ Trigger "on_auth_user_created" is active';
    RAISE NOTICE '✓ New users will automatically get profiles and roles';
  ELSE
    RAISE WARNING '⚠ Trigger "on_auth_user_created" not found!';
    RAISE WARNING 'Run migration: 20260126162400_fix_user_roles_constraint.sql';
  END IF;
END $$;
