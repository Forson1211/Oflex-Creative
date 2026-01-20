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