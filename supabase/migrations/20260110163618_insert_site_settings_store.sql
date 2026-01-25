-- Add new site settings for store and contact pages
INSERT INTO public.site_settings (setting_key, setting_value, setting_type)
VALUES 
  ('store_title', 'Premium Digital Products', 'text'),
  ('store_description', 'Discover our collection of premium digital assets, templates, and AI prompts to supercharge your creative workflow.', 'textarea'),
  ('contact_page_title', 'Let''s Work Together', 'text'),
  ('contact_page_description', 'Have a project in mind? We''d love to hear from you. Send us a message and we''ll respond as soon as possible.', 'textarea'),
  ('portfolio_title', 'Our Creative Portfolio', 'text'),
  ('portfolio_description', 'Explore our collection of creative works spanning brand design, digital experiences, and AI-powered solutions.', 'textarea')
ON CONFLICT (setting_key) DO NOTHING;