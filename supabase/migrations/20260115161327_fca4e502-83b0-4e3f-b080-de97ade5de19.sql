-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members are viewable by everyone" 
ON public.team_members 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default team member
INSERT INTO public.team_members (name, role, bio, image_url, display_order) VALUES
('Creative Director', 'Founder & Lead Designer', 'Design is not just what it looks like and feels like. Design is how it works. At Oflex Creative, we believe in creating meaningful experiences that resonate with audiences and drive results.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', 1);

-- Add about page settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type) VALUES
('about_title', 'Crafting Digital Excellence', 'text'),
('about_description', 'Oflex Creative is a digital design studio specializing in creating premium visual experiences. From AI-powered prompts to complete brand identities, we bring creative visions to life with precision and artistry.', 'textarea'),
('about_story_title', 'The Journey So Far', 'text'),
('about_story', 'What started as a passion for digital design has evolved into a full-service creative studio. Oflex Creative was born from the belief that great design should be accessible to everyone, from startups to established brands.

Today, we combine traditional design principles with cutting-edge AI technology to deliver solutions that are both beautiful and effective. Our digital products have helped countless creators streamline their workflows and achieve stunning results.', 'textarea'),
('about_years_experience', '5+', 'text'),
('about_projects_completed', '200+', 'text'),
('about_image_url', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop', 'text')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;