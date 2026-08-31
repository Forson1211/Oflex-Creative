import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const { getSetting } = useSiteSettings();
  const { toast } = useToast();

  // Fetch FAQs from database
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  // Submit contact form mutation
  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Validate input
      const validated = contactSchema.parse(data);
      
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: validated.name,
          email: validated.email,
          subject: validated.subject,
          message: validated.message,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({ title: 'Message sent!', description: "We'll get back to you soon." });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 3000);
    },
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ title: 'Validation error', description: error.errors[0].message, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
      }
    },
  });

  const contactInfo = [
    { icon: Mail, label: 'Email', value: getSetting('contact_email', 'hello@oflexcreative.com'), href: `mailto:${getSetting('contact_email', 'hello@oflexcreative.com')}` },
    { icon: Phone, label: 'Phone', value: getSetting('phone_number', '+1 (555) 123-4567'), href: `tel:${getSetting('phone_number', '+1 (555) 123-4567').replace(/[^\d+]/g, '')}` },
    { icon: MapPin, label: 'Location', value: getSetting('address', 'San Francisco, CA'), href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getSetting('address', 'San Francisco, CA'))}` },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              Contact Us
            </span>
            <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              {getSetting('contact_page_title', 'Let\'s Work Together')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {getSetting('contact_page_description', 'Have a project in mind? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-sans text-2xl font-bold text-foreground mb-4">Get In Touch</h2>
                <p className="text-muted-foreground">
                  Ready to start your project? Contact us through any of these channels.
                </p>
              </div>

              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <a
                    href={info.href}
                    target={info.href.startsWith('http') ? '_blank' : undefined}
                    rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="block group"
                  >
                    <GlassCard hover={false} className="flex items-center gap-4 group-hover:border-primary/50 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <info.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.label}</p>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{info.value}</p>
                      </div>
                    </GlassCard>
                  </a>
                </motion.div>
              ))}

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {[
                    { name: 'Instagram', url: getSetting('social_instagram', '#') },
                    { name: 'Twitter', url: getSetting('social_twitter', '#') },
                    { name: 'LinkedIn', url: getSetting('social_linkedin', '#') },
                  ].filter(s => s.url && s.url !== '#').map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                    >
                      {social.name}
                    </a>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <GlassCard hover={false} className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={submitMutation.isPending}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={submitMutation.isPending}
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      disabled={submitMutation.isPending}
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your project..."
                      rows={6}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      disabled={submitMutation.isPending}
                      maxLength={2000}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                        />
                        Sending...
                      </>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="FAQ"
            title="Common Questions"
            description="Quick answers to questions you might have"
          />

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AccordionItem 
                    value={faq.id} 
                    className="bg-background/50 border border-border rounded-xl px-6 overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline text-left py-5">
                      <span className="font-semibold text-foreground">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>

            {faqs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No FAQs available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;