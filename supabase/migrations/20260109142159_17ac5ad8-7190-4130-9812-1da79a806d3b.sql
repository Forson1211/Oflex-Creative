-- Create services table for editable services
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  features TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Anyone can view active services
CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Admins can manage services
CREATE POLICY "Admins can manage services" 
ON public.services 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (title, description, icon, features, display_order) VALUES
('Creative Prompt Engineering', 'Custom AI prompts crafted for stunning image generation. Perfect for artists, marketers, and content creators looking to elevate their visual output.', 'Sparkles', ARRAY['Custom prompt templates', 'Style-specific prompts', 'Negative prompt optimization', 'Multi-platform compatibility'], 1),
('Digital Product Design', 'Premium digital products including templates, mockups, and design assets. Ready-to-use resources that save time and enhance your projects.', 'Palette', ARRAY['Social media templates', 'Presentation decks', 'Marketing materials', 'Print-ready designs'], 2),
('Branding & Visual Design', 'Complete brand identity packages including logos, color systems, and brand guidelines. Build a cohesive visual presence that stands out.', 'Layers', ARRAY['Logo design', 'Brand guidelines', 'Color palettes', 'Typography systems'], 3),
('UI/UX Design', 'User-centered interface design for web and mobile applications. Beautiful, functional designs that convert visitors into customers.', 'Code', ARRAY['Web app interfaces', 'Mobile app design', 'Design systems', 'Prototyping'], 4),
('AI Automation Consulting', 'Optimize your creative workflow with AI-powered solutions. From content generation to design automation, we help you work smarter.', 'Zap', ARRAY['Workflow analysis', 'Tool integration', 'Process automation', 'Training & support'], 5),
('Custom Design Solutions', 'Bespoke design services tailored to your unique needs. Whether it''s a one-off project or ongoing support, we''ve got you covered.', 'Wand2', ARRAY['Custom illustrations', 'Motion graphics', 'Print design', 'Packaging design'], 6);