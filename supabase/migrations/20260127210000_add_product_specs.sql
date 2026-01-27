-- Migration to add technical specs to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS file_size TEXT;

-- Update existing products with some default values if needed
UPDATE public.products SET resolution = '300 DPI' WHERE resolution IS NULL;
UPDATE public.products SET dimensions = '2000 x 2000 px' WHERE dimensions IS NULL;
UPDATE public.products SET file_size = '5 MB' WHERE file_size IS NULL;
