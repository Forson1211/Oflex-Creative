import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FooterSocialProof } from "@/components/layout/footer/FooterSocialProof";
import { FooterTrustBadges } from "@/components/layout/footer/FooterTrustBadges";
import { TrustedPartnersSection } from "@/components/layout/footer/TrustedPartnersSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/image-optimizer";

export const Footer = () => {
  const { getSetting } = useSiteSettings();

  // Helper to get a clean embed URL even if user pastes full iframe tag or a standard link
  const getCleanMapUrl = (url: string) => {
    if (!url) return '';

    // 1. If it's a full iframe tag, extract the src
    if (url.includes('<iframe')) {
      const match = url.match(/src="([^"]+)"/);
      if (match && match[1]) return match[1];
    }

    // 2. If it's a standard "place" or search URL, convert it to embed format
    // Format: https://www.google.com/maps/place/Name+Of+Place/...
    if (url.includes('google.com/maps/place/')) {
      try {
        const parts = url.split('google.com/maps/place/');
        if (parts[1]) {
          const placeName = parts[1].split('/')[0];
          return `https://maps.google.com/maps?q=${placeName}&output=embed`;
        }
      } catch (e) {
        console.error("Error parsing map URL:", e);
      }
    }

    // 3. Fallback for search query format
    if (url.includes('google.com/maps/search/')) {
      const parts = url.split('google.com/maps/search/');
      if (parts[1]) {
        return `https://maps.google.com/maps?q=${parts[1]}&output=embed`;
      }
    }

    return url.trim();
  };

  // Fetch latest products for footer
  const { data: footerProducts = [] } = useQuery({
    queryKey: ["latest-products-footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data || [];
    },
  });

  const socialLinks = [
    { icon: Instagram, href: getSetting('social_instagram', '#'), label: 'Instagram' },
    { icon: Twitter, href: getSetting('social_twitter', '#'), label: 'Twitter' },
    { icon: Linkedin, href: getSetting('social_linkedin', '#'), label: 'LinkedIn' },
    { icon: Facebook, href: getSetting('social_facebook', '#'), label: 'Facebook' },
  ];

  const logoUrl = getSetting('logo_url', '');
  const siteName = getSetting('site_name', 'Oflex Creative');

  return (
    <footer
      className="text-white border-t border-white/10 transition-colors duration-300"
      style={{ backgroundColor: getSetting('footer_color', 'hsl(220, 30%, 8%)') }}
    >
      {/* Social Proof Stats */}
      <FooterSocialProof />

      <div className="container mx-auto px-4 py-10">
        {/* Logo and Social Icons Row */}
        <div className="flex items-center justify-between gap-6 mb-8">
          {/* Logo */}
          <Link to="/" className="inline-block">
            <img
              src={getSetting('logo_white_url') || getSetting('logo_dark_url') || "/logo-white.png"}
              alt={siteName}
              loading="lazy"
              decoding="async"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Social Icons */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-none bg-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          )}
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column - Logo & Navigation Accordions */}
          <div className="lg:col-span-8 xl:col-span-7 space-y-6">
            {/* Accordion Navigation - Mobile */}
            <div className="md:hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="about" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">
                    About
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3 pl-2">
                      <Link
                        to="/about"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Our Story
                      </Link>
                      <Link
                        to="/about"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Team
                      </Link>
                      <Link
                        to="/contact"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Contact
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="discover" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">
                    Discover
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3 pl-2">
                      <Link
                        to="/portfolio"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Portfolio
                      </Link>
                      <Link
                        to="/store"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Store
                      </Link>
                      <Link
                        to="/blog"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Blog
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="services" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">
                    Services
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3 pl-2">
                      <Link
                        to="/services"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Prompt Engineering
                      </Link>
                      <Link
                        to="/services"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Digital Design
                      </Link>
                      <Link
                        to="/services"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Branding
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="support" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">
                    Support
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3 pl-2">
                      <Link
                        to="#"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      <Link
                        to="#"
                        className="text-[15px] text-white hover:text-primary transition-colors"
                      >
                        Terms of Service
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>

            {/* Desktop Navigation Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h4 className="text-[16px] uppercase font-bold text-white tracking-widest mb-6">About</h4>
                <div className="flex flex-col gap-3">
                  <Link to="/about" className="text-[16px] text-white hover:text-primary transition-colors">Our Story</Link>
                  <Link to="/about" className="text-[16px] text-white hover:text-primary transition-colors">Team</Link>
                  <Link to="/contact" className="text-[16px] text-white hover:text-primary transition-colors">Contact</Link>
                </div>
              </div>

              <div>
                <h4 className="text-[16px] uppercase font-bold text-white tracking-widest mb-6">Discover</h4>
                <div className="flex flex-col gap-3">
                  <Link to="/portfolio" className="text-[16px] text-white hover:text-primary transition-colors">Portfolio</Link>
                  <Link to="/store" className="text-[16px] text-white hover:text-primary transition-colors">Store</Link>
                  <Link to="/blog" className="text-[16px] text-white hover:text-primary transition-colors">Blog</Link>
                </div>
              </div>

              <div>
                <h4 className="text-[16px] uppercase font-bold text-white tracking-widest mb-6">Services</h4>
                <div className="flex flex-col gap-3">
                  <Link to="/services" className="text-[16px] text-white hover:text-primary transition-colors">Prompt Engineering</Link>
                  <Link to="/services" className="text-[16px] text-white hover:text-primary transition-colors">Digital Design</Link>
                  <Link to="/services" className="text-[16px] text-white hover:text-primary transition-colors">Branding</Link>
                </div>
              </div>

              <div>
                <h4 className="text-[16px] uppercase font-bold text-white tracking-widest mb-6">Support</h4>
                <div className="flex flex-col gap-3">
                  <Link to="#" className="text-[16px] text-white hover:text-primary transition-colors">Privacy Policy</Link>
                  <Link to="#" className="text-[16px] text-white hover:text-primary transition-colors">Terms of Service</Link>
                </div>
              </div>
            </div>

            {/* Location Map Section */}
            {getSetting('google_maps_embed_url') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="pt-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h4 className="text-[15px] uppercase font-bold text-white tracking-widest">Our Location</h4>
                </div>
                <div className="w-full h-48 rounded-xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-500">
                  <iframe
                    src={getCleanMapUrl(getSetting('google_maps_embed_url'))}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    title="Store Location"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Featured Projects */}
          <div className="lg:col-span-4 xl:col-span-5 lg:pl-8 lg:border-l lg:border-white/10 space-y-10">
            {/* Newsletter Subscription */}
            <div>
              <h4 className="text-[16px] uppercase font-bold text-white tracking-widest mb-6">Stay Updated</h4>
              <p className="text-[16px] text-white leading-relaxed max-w-sm mb-4">
                Subscribe to our newsletter for the latest design trends and updates.
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary h-10"
                  />
                </div>
                <Button size="sm" type="submit" className="h-10 px-4">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Visit Store Section */}
            <div>
              <h4 className="text-[16px] uppercase font-bold text-white tracking-widest mb-6">Visit Store</h4>
              <div className="space-y-4">
                {footerProducts.length > 0 ? (
                  footerProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group flex items-center gap-3 p-3 rounded-none bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-none overflow-hidden flex-shrink-0 bg-white/10">
                        <img
                          src={product.image_url ? getOptimizedImageUrl(product.image_url, 100) : ""}
                          alt={product.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[15px] font-medium text-white truncate">
                          {product.title}
                        </h5>
                        <p className="text-[13px] text-white/80">{product.category}</p>
                        <p className="text-xs font-bold text-primary mt-1">${product.price}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors flex-shrink-0" />
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-white/60">No products found</div>
                )}
                <Button variant="link" className="text-xs p-0 h-auto text-primary hover:text-primary/80" asChild>
                  <Link to="/store">View all products <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 space-y-6">
          {/* Trust Badges */}
          <FooterTrustBadges />

          {/* Trusted Partners */}
          <TrustedPartnersSection />

          {/* Copyright and Domain */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/60 text-center md:text-left">
              {getSetting(
                "footer_text",
                `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`
              )}
            </p>
            <p className="text-sm text-white/40">
              Developed by <span className="text-primary font-medium">Oflex Creative</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};