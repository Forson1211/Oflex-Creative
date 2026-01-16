-- Fix RLS policies for user_roles table to allow admins to INSERT roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create separate policies for each operation
CREATE POLICY "Admins can select all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add template_link column to products table for digital product download links
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS template_link TEXT;

-- Create purchases table to track completed purchases and provide download access
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  template_link TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System can insert purchases (via order completion)
CREATE POLICY "Admins can manage purchases"
ON public.purchases FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users and admins can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create site_analytics table for storing analytics data
CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on site_analytics
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage analytics
CREATE POLICY "Admins can view analytics"
ON public.site_analytics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage analytics"
ON public.site_analytics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert some sample analytics data
INSERT INTO public.site_analytics (date, page_views, unique_visitors, orders_count, revenue, new_users)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 156, 89, 3, 45.00, 12),
  (CURRENT_DATE - INTERVAL '5 days', 203, 112, 5, 78.50, 18),
  (CURRENT_DATE - INTERVAL '4 days', 178, 95, 4, 62.00, 14),
  (CURRENT_DATE - INTERVAL '3 days', 245, 134, 7, 112.00, 22),
  (CURRENT_DATE - INTERVAL '2 days', 312, 167, 9, 156.50, 31),
  (CURRENT_DATE - INTERVAL '1 day', 289, 156, 8, 134.00, 27),
  (CURRENT_DATE, 198, 102, 4, 68.00, 16)
ON CONFLICT DO NOTHING;