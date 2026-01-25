-- =============================================
-- ADMIN USER MANAGEMENT & SECURITY FEATURES
-- =============================================

-- 1. User Activity Tracking Table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'password_reset', 'failed_login'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Add security fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_reason TEXT,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP WITH TIME ZONE;

-- 3. Enable RLS on activity log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Admin can view all activity logs" ON public.user_activity_log;
CREATE POLICY "Admin can view all activity logs" ON public.user_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_log;
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert activity logs" ON public.user_activity_log;
CREATE POLICY "System can insert activity logs" ON public.user_activity_log
  FOR INSERT
  WITH CHECK (true);

-- 5. Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_activity_type, p_ip_address, p_user_agent, p_metadata);
END;
$$;

-- 6. Function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_at = now(),
    last_login_ip = p_ip_address,
    failed_login_attempts = 0
  WHERE user_id = p_user_id;
  
  -- Log the activity
  PERFORM public.log_user_activity(p_user_id, 'login', p_ip_address);
END;
$$;

-- 7. Function to lock/unlock user account (Admin only)
CREATE OR REPLACE FUNCTION public.admin_lock_user_account(
  p_user_id UUID,
  p_lock BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_role TEXT;
BEGIN
  -- Check if caller is admin
  v_admin_id := auth.uid();
  SELECT role INTO v_admin_role FROM public.user_roles WHERE user_id = v_admin_id;
  
  IF v_admin_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Update account lock status
  UPDATE public.profiles
  SET 
    account_locked = p_lock,
    locked_reason = CASE WHEN p_lock THEN p_reason ELSE NULL END,
    locked_at = CASE WHEN p_lock THEN now() ELSE NULL END,
    locked_by = CASE WHEN p_lock THEN v_admin_id ELSE NULL END
  WHERE user_id = p_user_id;

  -- Log the activity
  PERFORM public.log_user_activity(
    p_user_id,
    CASE WHEN p_lock THEN 'account_locked' ELSE 'account_unlocked' END,
    NULL,
    NULL,
    jsonb_build_object('admin_id', v_admin_id, 'reason', p_reason)
  );

  RETURN json_build_object(
    'success', true,
    'message', CASE WHEN p_lock THEN 'Account locked' ELSE 'Account unlocked' END
  );
END;
$$;

-- 8. Function to force password reset (Admin only)
CREATE OR REPLACE FUNCTION public.admin_force_password_reset(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_role TEXT;
BEGIN
  -- Check if caller is admin
  v_admin_id := auth.uid();
  SELECT role INTO v_admin_role FROM public.user_roles WHERE user_id = v_admin_id;
  
  IF v_admin_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Set force password reset flag
  UPDATE public.profiles
  SET force_password_reset = true
  WHERE user_id = p_user_id;

  -- Log the activity
  PERFORM public.log_user_activity(
    p_user_id,
    'password_reset_forced',
    NULL,
    NULL,
    jsonb_build_object('admin_id', v_admin_id)
  );

  RETURN json_build_object('success', true, 'message', 'User will be required to reset password on next login');
END;
$$;

-- 9. Function to get user security info (Admin only)
CREATE OR REPLACE FUNCTION public.admin_get_user_security_info(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_result JSON;
BEGIN
  -- Check if caller is admin
  SELECT role INTO v_admin_role FROM public.user_roles WHERE user_id = auth.uid();
  
  IF v_admin_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get user security information
  SELECT json_build_object(
    'user_id', p.user_id,
    'email', u.email,
    'full_name', p.full_name,
    'account_locked', p.account_locked,
    'locked_reason', p.locked_reason,
    'locked_at', p.locked_at,
    'force_password_reset', p.force_password_reset,
    'last_login_at', p.last_login_at,
    'last_login_ip', p.last_login_ip,
    'failed_login_attempts', p.failed_login_attempts,
    'last_failed_login_at', p.last_failed_login_at,
    'created_at', p.created_at,
    'recent_activity', (
      SELECT json_agg(row_to_json(a))
      FROM (
        SELECT activity_type, ip_address, created_at
        FROM public.user_activity_log
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
      ) a
    )
  ) INTO v_result
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = p_user_id;

  RETURN v_result;
END;
$$;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_account_locked ON public.profiles(account_locked);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at DESC);

-- Grant permissions
GRANT ALL ON public.user_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_last_login TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lock_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_password_reset TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_security_info TO authenticated;
