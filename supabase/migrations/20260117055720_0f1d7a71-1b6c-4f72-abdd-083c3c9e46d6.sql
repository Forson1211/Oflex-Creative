-- Drop the overly permissive policy - edge functions with service role bypass RLS
DROP POLICY IF EXISTS "System can update order status via service role" ON public.orders;