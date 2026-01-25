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