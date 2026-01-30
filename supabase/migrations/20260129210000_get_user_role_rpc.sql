-- Create a secure way to get user role without RLS issues
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role public.app_role;
BEGIN
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user_id;
    RETURN COALESCE(v_role, 'user'::public.app_role);
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;
