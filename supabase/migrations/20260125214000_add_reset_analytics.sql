-- Migration to add admin_reset_site_analytics function
CREATE OR REPLACE FUNCTION public.admin_reset_site_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user is an admin or moderator
    IF NOT public.has_role_or_higher('moderator', auth.uid()) THEN
        RAISE EXCEPTION 'Only moderators and admins can reset analytics';
    END IF;

    -- Clear site_analytics table
    DELETE FROM public.site_analytics;
    
    -- Delete all pending orders
    -- This also deletes associated order_items due to ON DELETE CASCADE
    DELETE FROM public.orders WHERE status = 'pending';
    
    -- Note: Completed orders and user accounts are NOT deleted as per requirements
END;
$$;

GRANT ALL ON FUNCTION public.admin_reset_site_analytics() TO authenticated;
