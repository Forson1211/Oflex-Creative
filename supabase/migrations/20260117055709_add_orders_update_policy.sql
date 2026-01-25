-- Add UPDATE policy for orders table (needed for payment webhook to update order status)
CREATE POLICY "System can update order status via service role"
ON public.orders
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add a payment_reference column to orders table for tracking Paystack references
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT;