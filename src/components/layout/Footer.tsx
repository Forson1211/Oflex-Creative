import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Facebook, Mail, Send } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import oflexLogo from '@/assets/oflex-logo.png';

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

  return (
    <footer className="bg-card border-t border-border">
      {/* Mobile Newsletter Section */}
      <div className="md:hidden border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-foreground mb-2 text-center">Subscribe to Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4 text-center">Stay updated with our latest projects and offers</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" size="icon" disabled={isSubscribing}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src={logoUrl || oflexLogo} 
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

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-muted-foreground text-sm">
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