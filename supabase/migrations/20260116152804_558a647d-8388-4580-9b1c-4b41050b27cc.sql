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