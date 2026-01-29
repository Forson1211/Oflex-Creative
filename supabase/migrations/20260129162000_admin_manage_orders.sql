-- Allow admins and moderators to update orders (e.g. changing status)
-- This policy ensures that staff can process orders
CREATE POLICY "Admins and moderators can update orders"
  ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Allow admins (only) to delete orders
-- Strictly limits deletion to admins for security
CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
