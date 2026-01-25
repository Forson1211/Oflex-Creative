-- Create a secure view for public product listings that excludes sensitive columns
CREATE VIEW public.products_public AS
SELECT 
  id,
  title,
  description,
  price,
  category,
  image_url,
  is_active,
  created_at,
  updated_at
FROM public.products
WHERE is_active = true;

-- Grant SELECT permission on the view to authenticated and anon roles
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.products_public IS 'Public view of products that excludes sensitive columns (template_link, file_url)';

-- Create an INSERT policy for purchases table to allow users to insert their own purchases
-- This is needed for the checkout flow but should only happen through proper payment verification
CREATE POLICY "Users can insert their own purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);