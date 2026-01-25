-- 1. Function to safely update daily analytics
CREATE OR REPLACE FUNCTION public.update_daily_analytics(
  col_name TEXT, 
  increment_val NUMERIC DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.site_analytics (date, page_views, unique_visitors, orders_count, revenue, new_users)
  VALUES (CURRENT_DATE, 0, 0, 0, 0, 0)
  ON CONFLICT (date) DO NOTHING;

  EXECUTE format('UPDATE public.site_analytics SET %I = %I + $1 WHERE date = CURRENT_DATE', col_name, col_name)
  USING increment_val;
END;
$$;

-- 2. Trigger function for new users
CREATE OR REPLACE FUNCTION public.on_user_signup_analytics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_daily_analytics('new_users', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for user signup analytics
DROP TRIGGER IF EXISTS tr_user_signup_analytics ON public.profiles;
CREATE TRIGGER tr_user_signup_analytics
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_user_signup_analytics();

-- 4. Trigger function for completed orders
CREATE OR REPLACE FUNCTION public.on_order_completed_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status changed to 'completed'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') OR 
     (TG_OP = 'INSERT' AND NEW.status = 'completed') THEN
    PERFORM public.update_daily_analytics('orders_count', 1);
    PERFORM public.update_daily_analytics('revenue', NEW.total_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for order analytics
DROP TRIGGER IF EXISTS tr_order_completed_analytics ON public.orders;
CREATE TRIGGER tr_order_completed_analytics
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.on_order_completed_analytics();

-- 6. RPC function for aggregated admin statistics
-- This is faster and cleaner than doing multiple queries from the frontend
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', (SELECT count(*) FROM public.products WHERE is_active = true),
        'total_orders', (SELECT count(*) FROM public.orders),
        'total_revenue', (SELECT coalesce(sum(total_amount), 0) FROM public.orders WHERE status = 'completed'),
        'total_users', (SELECT count(*) FROM public.profiles),
        'completed_orders', (SELECT count(*) FROM public.orders WHERE status = 'completed'),
        'pending_orders', (SELECT count(*) FROM public.orders WHERE status = 'pending'),
        'recent_orders', (
            SELECT coalesce(json_agg(t), '[]'::json)
            FROM (
                SELECT id, status, total_amount, created_at, payment_provider
                FROM public.orders
                ORDER BY created_at DESC
                LIMIT 5
            ) t
        )
    ) INTO result;
    RETURN result;
END;
$$;

-- 7. Add columns for better order tracking if not exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 8. Ensure Admin has full control over all tables
-- This fixes any missed RLS policies
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
