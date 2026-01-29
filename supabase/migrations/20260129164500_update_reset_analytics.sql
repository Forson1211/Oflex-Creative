-- Update admin_reset_site_analytics function to delete ALL orders
CREATE OR REPLACE FUNCTION public.admin_reset_site_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user is an admin or moderator
    IF NOT public.has_role_or_higher(auth.uid(), 'moderator'::public.app_role) THEN
        RAISE EXCEPTION 'Only moderators and admins can reset analytics';
    END IF;

    -- Clear site_analytics table
    DELETE FROM public.site_analytics;
    
    -- Delete ALL orders (Recent orders) to fully reset the dashboard
    -- This includes pending, completed, cancelled, etc.
    -- This also deletes associated order_items due to ON DELETE CASCADE
    DELETE FROM public.orders;
    
END;
$$;
