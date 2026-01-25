-- Drop and recreate the view with SECURITY INVOKER (default, but explicit is better)
DROP VIEW IF EXISTS public.products_public;

CREATE VIEW public.products_public 
WITH (security_invoker = true)
AS
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

-- Grant SELECT permission on the view
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.products_public IS 'Public view of products that excludes sensitive columns (template_link, file_url). Uses SECURITY INVOKER.';