-- Allow admins and moderators to delete orders
-- Previously confined to admins only, but moderators need this capability too.
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Admins and moderators can delete orders"
  ON public.orders
  FOR DELETE
  USING (public.has_role_or_higher(auth.uid(), 'moderator'));
