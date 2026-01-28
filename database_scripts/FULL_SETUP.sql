-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  file_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cart items policies
CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Order items policies
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert order items for their orders" ON public.order_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW; -- Return NEW ensures the Auth User is created even if profile creation totally fails (fallback)
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
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
('footer_text', 'Â© 2024 Oflex Creative. All rights reserved.', 'text'),
('social_instagram', '', 'text'),
('social_twitter', '', 'text'),
('social_facebook', '', 'text'),
('social_linkedin', '', 'text'),
('about_title', 'About Us', 'text'),
('about_description', 'Oflex Creative is a digital design studio specializing in creating premium visual experiences.', 'textarea'),
('phone_number', '+1 (555) 123-4567', 'text'),
('address', 'San Francisco, CA', 'text')
ON CONFLICT (setting_key) DO NOTHING;
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
-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "FAQs are viewable by everyone" 
ON public.faqs 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage FAQs" 
ON public.faqs 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
('What is your typical response time?', 'We typically respond within 24 hours during business days.', 1),
('Do you offer custom design services?', 'Yes! We offer bespoke design solutions tailored to your specific needs.', 2),
('What payment methods do you accept?', 'We accept all major credit cards and PayPal for digital products.', 3),
('Can I request revisions?', 'Absolutely. We work with you until you''re completely satisfied.', 4);
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
-- Fix RLS policies for user_roles table to allow admins to INSERT roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create separate policies for each operation
CREATE POLICY "Admins can select all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add template_link column to products table for digital product download links
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS template_link TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS file_size TEXT;

-- Create purchases table to track completed purchases and provide download access
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  template_link TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System can insert purchases (via order completion)
CREATE POLICY "Admins can manage purchases"
ON public.purchases FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users and admins can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create site_analytics table for storing analytics data
CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on site_analytics
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage analytics
CREATE POLICY "Admins can view analytics"
ON public.site_analytics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage analytics"
ON public.site_analytics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert some sample analytics data
INSERT INTO public.site_analytics (date, page_views, unique_visitors, orders_count, revenue, new_users)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 156, 89, 3, 45.00, 12),
  (CURRENT_DATE - INTERVAL '5 days', 203, 112, 5, 78.50, 18),
  (CURRENT_DATE - INTERVAL '4 days', 178, 95, 4, 62.00, 14),
  (CURRENT_DATE - INTERVAL '3 days', 245, 134, 7, 112.00, 22),
  (CURRENT_DATE - INTERVAL '2 days', 312, 167, 9, 156.50, 31),
  (CURRENT_DATE - INTERVAL '1 day', 289, 156, 8, 134.00, 27),
  (CURRENT_DATE, 198, 102, 4, 68.00, 16)
ON CONFLICT DO NOTHING;
-- Create trusted_partners table for admin-managed partner logos
CREATE TABLE public.trusted_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trusted_partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for trusted_partners
CREATE POLICY "Anyone can view active trusted partners"
  ON public.trusted_partners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage trusted partners"
  ON public.trusted_partners
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default partners
INSERT INTO public.trusted_partners (name, logo_url, website_url, display_order) VALUES
  ('Canva', 'https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg', 'https://www.canva.com', 1),
  ('PosterMyWall', 'https://www.postermywall.com/assets/img/logo.svg', 'https://www.postermywall.com', 2),
  ('Freepik', 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Freepik_logo.svg', 'https://www.freepik.com', 3);

-- Create trigger for updated_at
CREATE TRIGGER update_trusted_partners_updated_at
  BEFORE UPDATE ON public.trusted_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add moderator role permissions checking function
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'admin' 
        OR (_role = 'moderator' AND role IN ('admin', 'moderator'))
        OR (_role = 'user' AND role IN ('admin', 'moderator', 'user'))
      )
  )
$$;

-- Update RLS policies for products to allow moderators
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and moderators can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.has_role_or_higher(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role_or_higher(auth.uid(), 'moderator'));
-- Create a secure view for public product listings that excludes sensitive columns
CREATE VIEW public.products_public AS
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

-- Grant SELECT permission on the view to authenticated and anon roles
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.products_public IS 'Public view of products that excludes sensitive columns (template_link, file_url)';

-- Create an INSERT policy for purchases table to allow users to insert their own purchases
-- This is needed for the checkout flow but should only happen through proper payment verification
CREATE POLICY "Users can insert their own purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);
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
-- Add UPDATE policy for orders table (needed for payment webhook to update order status)
CREATE POLICY "System can update order status via service role"
ON public.orders
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add a payment_reference column to orders table for tracking Paystack references
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT;
-- Drop the overly permissive policy - edge functions with service role bypass RLS
DROP POLICY IF EXISTS "System can update order status via service role" ON public.orders;
-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can view contact messages
CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update (mark as read)
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (submit contact form)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Add update policy for orders (for admin to update status)
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
-- Add footer_color setting if it doesn't exist
INSERT INTO public.site_settings (setting_key, setting_value, setting_type)
VALUES ('footer_color', '', 'color')
ON CONFLICT (setting_key) DO NOTHING;

-- Create store_slides table for the store page hero slider
CREATE TABLE public.store_slides (
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
ALTER TABLE public.store_slides ENABLE ROW LEVEL SECURITY;

-- Create policies for store_slides (public read for active slides, admin write)
CREATE POLICY "Anyone can view active store slides" 
ON public.store_slides 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage store slides" 
ON public.store_slides 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_store_slides_updated_at
BEFORE UPDATE ON public.store_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
-- Tighten INSERT policy on contact_messages to avoid WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact form"
ON public.contact_messages
FOR INSERT
WITH CHECK (
  -- basic validation to avoid permissive policy lint
  btrim(name) <> ''
  AND btrim(email) <> ''
  AND btrim(subject) <> ''
  AND btrim(message) <> ''
  AND char_length(name) <= 100
  AND char_length(email) <= 255
  AND char_length(subject) <= 200
  AND char_length(message) <= 2000
);
-- Allow authenticated users to submit testimonials while keeping admin moderation.
-- We add user_id to link the submission to the user and enable an INSERT policy.

ALTER TABLE public.testimonials
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Helpful index for admin views / auditing
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON public.testimonials (user_id);

-- Policy: authenticated users can submit a testimonial for themselves (stored inactive for moderation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'testimonials'
      AND policyname = 'Users can submit testimonials'
  ) THEN
    CREATE POLICY "Users can submit testimonials"
    ON public.testimonials
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = user_id
      AND is_active = false
      AND btrim(name) <> ''
      AND btrim(role) <> ''
      AND btrim(content) <> ''
      AND char_length(name) <= 100
      AND char_length(role) <= 100
      AND char_length(content) <= 2000
      AND (rating IS NULL OR (rating >= 1 AND rating <= 5))
      AND (avatar_url IS NULL OR char_length(avatar_url) <= 2000)
    );
  END IF;
END $$;

-- Note: existing policies remain:
-- - Anyone can view active testimonials (SELECT)
-- - Admins can manage testimonials (ALL)
