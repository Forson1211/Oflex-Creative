-- Add more site settings for comprehensive admin control
INSERT INTO public.site_settings (setting_key, setting_value, setting_type) VALUES
  ('cta_title', 'Ready to Start Your Project?', 'text'),
  ('cta_description', 'Let''s collaborate and bring your creative vision to life. Get in touch today!', 'text'),
  ('cta_button_text', 'Get In Touch', 'text'),
  ('store_title', 'Digital Store', 'text'),
  ('store_description', 'Premium digital assets, prompts, and design resources', 'text'),
  ('portfolio_title', 'Our Portfolio', 'text'),
  ('portfolio_description', 'Explore our collection of creative works and projects', 'text'),
  ('contact_page_title', 'Get In Touch', 'text'),
  ('contact_page_description', 'Have a project in mind? We''d love to hear from you. Send us a message and we''ll respond as soon as possible.', 'text'),
  ('newsletter_title', 'Subscribe to Our Newsletter', 'text'),
  ('newsletter_description', 'Stay updated with our latest projects, creative insights, and exclusive offers', 'text')
ON CONFLICT (setting_key) DO NOTHING;

-- Create testimonials table for dynamic testimonials management
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Policies for testimonials
CREATE POLICY "Anyone can view active testimonials"
  ON public.testimonials
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default testimonials
INSERT INTO public.testimonials (name, role, content, avatar_url, rating, display_order) VALUES
  ('Sarah Chen', 'Startup Founder', 'Oflex Creative transformed our brand identity. The attention to detail is incredible!', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', 5, 1),
  ('Marcus Johnson', 'Creative Director', 'The prompt packs saved us countless hours. Highly recommend for any creative team.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', 5, 2),
  ('Emily Rodriguez', 'Marketing Manager', 'Professional, creative, and incredibly responsive. A true partner in design.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', 5, 3);
