-- Create featured_projects table for portfolio projects that admin can edit
CREATE TABLE public.featured_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table for site customization
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for featured_projects
CREATE POLICY "Anyone can view featured projects"
ON public.featured_projects
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage featured projects"
ON public.featured_projects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for site_settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_featured_projects_updated_at
BEFORE UPDATE ON public.featured_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type) VALUES
('site_name', 'Oflex Creative', 'text'),
('site_tagline', 'Crafting Digital Experiences', 'text'),
('hero_title', 'Crafting Digital', 'text'),
('hero_subtitle', 'Experiences', 'text'),
('hero_description', 'From AI prompts to stunning designs, we bring your creative visions to life. Explore our portfolio and discover premium digital products.', 'textarea'),
('primary_color', '#8B5CF6', 'color'),
('contact_email', 'hello@oflexcreative.com', 'text');

-- Insert sample featured projects
INSERT INTO public.featured_projects (title, category, image_url, description, display_order) VALUES
('Brand Identity System', 'Branding', 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop', 'Complete brand identity design for tech startup', 1),
('E-commerce Dashboard', 'UI/UX', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'Modern dashboard design for e-commerce platform', 2),
('Mobile App Design', 'UI/UX', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop', 'Fitness tracking mobile app interface', 3),
('Creative Poster Series', 'Posters', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', 'Art exhibition promotional materials', 4);