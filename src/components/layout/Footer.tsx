import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Facebook, Mail, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';


interface TrustedPartner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

const TrustedPartnersSection = () => {
  const { data: partners = [] } = useQuery({
    queryKey: ['trusted-partners-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trusted_partners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as TrustedPartner[];
    },
  });

  if (partners.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.35 }}
      className="mt-12 pt-8 border-t border-border"
    >
      <p className="text-center text-sm text-muted-foreground mb-6">Trusted platforms I work with</p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {partners.map((partner) => (
          <motion.a
            key={partner.id}
            href={partner.website_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1, opacity: 1 }}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <img
              src={partner.logo_url}
              alt={partner.name}
              className="h-8 w-auto max-w-[120px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
};

const quickLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Contact', path: '/contact' },
];

const serviceLinks = [
  { name: 'Prompt Engineering', path: '/services' },
  { name: 'Digital Design', path: '/services' },
  { name: 'Branding', path: '/services' },
  { name: 'UI/UX Design', path: '/services' },
];

export const Footer = () => {
  const { getSetting } = useSiteSettings();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const socialLinks = [
    { icon: Instagram, href: getSetting('social_instagram', '#'), label: 'Instagram' },
    { icon: Twitter, href: getSetting('social_twitter', '#'), label: 'Twitter' },
    { icon: Linkedin, href: getSetting('social_linkedin', '#'), label: 'LinkedIn' },
    { icon: Facebook, href: getSetting('social_facebook', '#'), label: 'Facebook' },
  ].filter(link => link.href && link.href !== '#');

  const logoUrl = getSetting('logo_url', '');
  const footerColor = getSetting('footer_color', '');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubscribing(true);
    // Simulate subscription
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Subscribed!', description: 'Thanks for subscribing to our newsletter.' });
    setEmail('');
    setIsSubscribing(false);
  };

  // Dynamic footer background style - ensure color is applied correctly
  const hasCustomColor = footerColor && footerColor.trim() !== '' && footerColor !== 'undefined';
  
  const footerStyle: React.CSSProperties = hasCustomColor 
    ? { backgroundColor: footerColor } 
    : {};

  return (
    <footer 
      className={`border-t border-border ${!hasCustomColor ? 'bg-card' : ''}`} 
      style={footerStyle}
    >
      {/* Newsletter Section - Shows on ALL devices */}
      <div className={`border-b border-border ${!hasCustomColor ? 'bg-gradient-to-r from-primary/5 via-transparent to-primary/5' : ''}`}>
        <div className="container mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h4 className="text-xl md:text-2xl font-bold text-foreground mb-2">Subscribe to Our Newsletter</h4>
            <p className="text-sm md:text-base text-muted-foreground mb-6">Stay updated with our latest projects, creative insights, and exclusive offers</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12"
                required
              />
              <Button type="submit" size="lg" disabled={isSubscribing} className="h-12 px-6">
                {isSubscribing ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Send className="w-4 h-4" />
                    </motion.span>
                    Subscribing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Subscribe
                  </span>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-2 lg:col-span-1"
          >
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src={logoUrl || '/placeholder.svg'} 
                alt={getSetting('site_name', 'Oflex Creative')} 
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {getSetting('about_description', 'Crafting digital experiences that inspire. From AI prompts to stunning designs, we bring your creative visions to life.')}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-left"
          >
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-left"
          >
            <h4 className="font-semibold text-foreground mb-4">Services</h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-left"
          >
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {getSetting('contact_email') && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${getSetting('contact_email')}`} className="hover:text-primary transition-colors">
                    {getSetting('contact_email')}
                  </a>
                </li>
              )}
              {getSetting('phone_number') && (
                <li>{getSetting('phone_number')}</li>
              )}
              {getSetting('address') && (
                <li>{getSetting('address')}</li>
              )}
            </ul>
          </motion.div>
        </div>

        {/* Trusted Partners Section - Dynamic from Database */}
        <TrustedPartnersSection />

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-muted-foreground text-sm text-center md:text-left">
            {getSetting('footer_text', `© ${new Date().getFullYear()} Oflex Creative. All rights reserved.`)}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};