-- Create a secure RPC function to delete orders
-- This bypasses Row Level Security on the table but enforces role checks internally
-- This solves issues where RLS policies might silently block deletion
CREATE OR REPLACE FUNCTION public.admin_delete_order(target_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Explicitly check for admin or moderator role
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
    ) THEN
        RAISE EXCEPTION 'Access Denied: You must be an admin or moderator to delete orders.';
    END IF;

    -- Perform the deletion
    DELETE FROM public.orders WHERE id = target_order_id;
    
    -- Check if any row was actually deleted (optional, but good for feedback)
    -- IF NOT FOUND THEN
    --    RAISE EXCEPTION 'Order not found';
    -- END IF;
END;
$$;

GRANT ALL ON FUNCTION public.admin_delete_order(UUID) TO authenticated;
