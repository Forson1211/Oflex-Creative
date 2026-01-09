-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Create storage bucket for site assets (logo, banners, etc)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true);

-- RLS policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for site-assets bucket
CREATE POLICY "Anyone can view site assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Add more site settings for expanded customization
INSERT INTO public.site_settings (setting_key, setting_value, setting_type) VALUES
('logo_url', '', 'image'),
('footer_text', '© 2024 Oflex Creative. All rights reserved.', 'text'),
('social_instagram', '', 'text'),
('social_twitter', '', 'text'),
('social_facebook', '', 'text'),
('social_linkedin', '', 'text'),
('about_title', 'About Us', 'text'),
('about_description', 'Oflex Creative is a digital design studio specializing in creating premium visual experiences.', 'textarea'),
('phone_number', '+1 (555) 123-4567', 'text'),
('address', 'San Francisco, CA', 'text')
ON CONFLICT (setting_key) DO NOTHING;