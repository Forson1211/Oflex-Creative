-- Allow admins to update orders (for status changes)
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert into purchases (already exists as "Admins can manage purchases", but making sure)
-- Just to be safe, we can drop and recreate or reliance on existing is fine if verified.
-- Existing: CREATE POLICY "Admins can manage purchases" ON public.purchases FOR ALL ...
-- This covers INSERT.

-- Verify products RLS for admin read (needed for fetching template_link)
-- Existing: CREATE POLICY "Admins can manage products" ON public.products FOR ALL ...
-- This covers SELECT.
