-- Create hero_slides table for the banner slider
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can read active slides
CREATE POLICY "Public can view active hero slides"
  ON public.hero_slides
  FOR SELECT
  USING (is_active = true);

-- Admins can manage slides (using has_role function)
CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default hero slides
INSERT INTO public.hero_slides (title, subtitle, image_url, display_order) VALUES
  ('Crafting Digital', 'Experiences', 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1920&h=1080&fit=crop', 0),
  ('Creative Solutions', 'For Every Need', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop', 1),
  ('Innovative Design', 'That Inspires', 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1920&h=1080&fit=crop', 2);

-- Add portfolio page settings to site_settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type) VALUES
  ('portfolio_title', 'Our Creative Work', 'text'),
  ('portfolio_description', 'Explore our diverse portfolio of design projects, from brand identities to digital interfaces and AI-generated art.', 'text')
ON CONFLICT (setting_key) DO NOTHING;