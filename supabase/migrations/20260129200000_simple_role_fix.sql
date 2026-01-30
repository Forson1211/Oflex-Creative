-- NEW function name to bypass any schema cache issues
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- 1. Verify Admin status of the caller
  SELECT role INTO v_caller_role FROM public.user_roles WHERE user_id = auth.uid();
  
  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change roles.';
  END IF;

  -- 2. Upsert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role::public.app_role)
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role,
      created_at = now();

  RETURN json_build_object(
    'success', true,
    'message', format('Role updated to %s', p_role)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_role TO authenticated;
