import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Facebook, Mail, ArrowUp } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { FooterLinksColumn } from '@/components/layout/footer/FooterLinksColumn';
import { FooterNewsletter } from '@/components/layout/footer/FooterNewsletter';
import { TrustedPartnersSection } from '@/components/layout/footer/TrustedPartnersSection';


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

const resourceLinks = [
  { name: 'Store', path: '/store' },
  { name: 'Services', path: '/services' },
  { name: 'FAQs', path: '/services' },
];

export const Footer = () => {
  const { getSetting } = useSiteSettings();

  const socialLinks = [
    { icon: Instagram, href: getSetting('social_instagram', '#'), label: 'Instagram' },
    { icon: Twitter, href: getSetting('social_twitter', '#'), label: 'Twitter' },
    { icon: Linkedin, href: getSetting('social_linkedin', '#'), label: 'LinkedIn' },
    { icon: Facebook, href: getSetting('social_facebook', '#'), label: 'Facebook' },
  ].filter(link => link.href && link.href !== '#');

  const logoUrl = getSetting('logo_url', '');
  const footerColor = getSetting('footer_color', '');

  // Dynamic footer background style - ensure color is applied correctly
  const hasCustomColor = footerColor && footerColor.trim() !== '' && footerColor !== 'undefined';
  
  const footerStyle: React.CSSProperties = hasCustomColor 
    ? { backgroundColor: footerColor } 
    : {};

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer 
      className={`border-t border-border ${!hasCustomColor ? 'bg-card' : ''}`} 
      style={footerStyle}
    >
      {/* Newsletter Section - Shows on ALL devices */}
      <FooterNewsletter hasCustomColor={hasCustomColor} />

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="sm:col-span-2 lg:col-span-2 text-center sm:text-left"
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center sm:justify-start mb-6">
              <Button asChild size="sm">
                <Link to="/contact">Start a Project</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/services">View Services</Link>
              </Button>
            </div>

            {getSetting('contact_email') && (
              <a
                href={`mailto:${getSetting('contact_email')}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 justify-center sm:justify-start"
              >
                <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </span>
                <span className="truncate">{getSetting('contact_email')}</span>
              </a>
            )}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 justify-center sm:justify-start">
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

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <FooterLinksColumn
              title="Resources"
              links={resourceLinks}
              align="center"
              showExternalIcon
            />
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <FooterLinksColumn title="Quick Links" links={quickLinks} align="center" />
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <FooterLinksColumn title="Services" links={serviceLinks} align="center" />
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center sm:text-left"
          >
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {getSetting('contact_email') && (
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </span>
                  <a
                    href={`mailto:${getSetting('contact_email')}`}
                    className="hover:text-primary transition-colors break-all"
                  >
                    {getSetting('contact_email')}
                  </a>
                </li>
              )}
              {getSetting('phone_number') && <li>{getSetting('phone_number')}</li>}
              {getSetting('address') && <li>{getSetting('address')}</li>}
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
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              Back to top
            </Button>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};