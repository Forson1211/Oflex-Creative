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
      {/* Newsletter Section - Shows on ALL devices */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
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

        {/* Trusted Partners Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <p className="text-center text-sm text-muted-foreground mb-6">Trusted platforms I work with</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
            {/* Canva Logo */}
            <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
              <svg className="h-8 w-auto" viewBox="0 0 100 30" fill="currentColor">
                <path d="M15.5 3C8.6 3 3 8.6 3 15.5S8.6 28 15.5 28 28 22.4 28 15.5 22.4 3 15.5 3zm0 22c-5.2 0-9.5-4.3-9.5-9.5S10.3 6 15.5 6 25 10.3 25 15.5 20.7 25 15.5 25z"/>
                <path d="M39 8.5c-3.9 0-7 3.1-7 7s3.1 7 7 7c2.1 0 4-1 5.3-2.5l-2.1-1.6c-.8 1-2 1.6-3.2 1.6-2.2 0-4-1.8-4-4s1.8-4 4-4c1.2 0 2.3.5 3.1 1.4l2.1-1.6C43 9.4 41.1 8.5 39 8.5zM54 8.5c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zM68.5 8.5c-2.5 0-4.5 2-4.5 4.5v9.5h3V13c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v9.5h3V13c0-2.5-2-4.5-4.5-4.5zM81 8.5l-4.5 14h3.2l1-3h4.6l1 3h3.2L85 8.5h-4zm.5 8l1.5-4.5 1.5 4.5h-3z"/>
              </svg>
            </a>
            
            {/* PosterMyWall Logo */}
            <a href="https://www.postermywall.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 text-foreground font-bold text-lg">
                <span className="text-primary">Poster</span>
                <span>MyWall</span>
              </div>
            </a>
            
            {/* Freepik Logo */}
            <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
              <svg className="h-7 w-auto" viewBox="0 0 120 30" fill="currentColor">
                <path d="M10 5h25v3H13v7h18v3H13v10h-3V5zM40 5h3v23h-3V5zM50 5h3v10h9V5h3v23h-3V18h-9v10h-3V5zM75 5h15v3H78v7h10v3H78v7h12v3H75V5zM95 5h15v3H98v7h10v3H98v7h12v3H95V5zM115 5h3v23h-3V5z"/>
              </svg>
            </a>
          </div>
        </motion.div>

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