-- Add missing columns to products table for enhanced product details
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS file_size TEXT;

-- Ensure template_link exists (it was in FULL_SETUP but just in case)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS template_link TEXT;

-- Comment on columns
COMMENT ON COLUMN public.products.resolution IS 'Product resolution (e.g. 300 DPI)';
COMMENT ON COLUMN public.products.dimensions IS 'Product dimensions (e.g. 2000x2000 px)';
COMMENT ON COLUMN public.products.file_size IS 'File size string (e.g. 5 MB)';
COMMENT ON COLUMN public.products.template_link IS 'Link to Canva template or similar external resource';
