import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  ArrowUp,
  ChevronDown,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrustedPartnersSection } from "@/components/layout/footer/TrustedPartnersSection";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const Footer = () => {
  const { getSetting } = useSiteSettings();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const siteName = getSetting('site_name', 'Oflex Creative');
  const footerBg = getSetting('footer_color', '#1A1028');

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    try {
      await supabase.from('newsletter_subscribers' as any).insert({ email: email.trim() });
    } catch (err) {
      console.error("Newsletter subscription error:", err);
    }
    toast({
      title: "Subscribed Successfully!",
      description: "Thank you for subscribing to our newsletter.",
    });
    setEmail("");
    setIsSubscribing(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { icon: Facebook, href: getSetting('social_facebook', '#'), label: 'Facebook' },
    { icon: Instagram, href: getSetting('social_instagram', '#'), label: 'Instagram' },
    { custom: XIcon, href: getSetting('social_twitter', '#'), label: 'X (Twitter)' },
    { icon: Youtube, href: getSetting('social_youtube', '#'), label: 'YouTube' },
    { icon: Linkedin, href: getSetting('social_linkedin', '#'), label: 'LinkedIn' },
  ];

  const footerSections = [
    {
      title: "About",
      links: [
        { label: "Our Story", href: "/about" },
        { label: "Our Team", href: "/about" },
        { label: "Why Choose Us", href: "/about" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    {
      title: "Discover",
      links: [
        { label: "Projects", href: "/portfolio" },
        { label: "Canva Store", href: "/store" },
        { label: "News & Articles", href: "/blog" },
        { label: "Showcase", href: "/portfolio" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "Development", href: "/services" },
        { label: "Graphic Design", href: "/services" },
        { label: "Photography", href: "/services" },
        { label: "Brand Strategy", href: "/services" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Login / Register", href: "/auth" },
        { label: "My Profile", href: "/profile" },
        { label: "My Orders", href: "/profile" },
        { label: "Checkout", href: "/checkout" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQs / Help", href: "/contact" },
        { label: "Start a Project", href: "/contact" },
        {
          label: "WhatsApp Support",
          href: `https://wa.me/${getSetting('whatsapp_number', '233549926839').replace(/\D/g, '')}`,
          isExternal: true,
        },
        { label: "Privacy & Terms", href: "/contact" },
      ],
    },
  ];

  return (
    <footer
      className="text-white border-t border-white/10 transition-colors duration-300 relative overflow-hidden font-sans"
      style={{ backgroundColor: footerBg }}
    >
      {/* Top Newsletter Row */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight font-lato">
                Subscribe to our Newsletter!
              </h3>
              <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl">
                Sign up our newsletter to get update news and articles.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="h-11 sm:h-12 px-4 w-full bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none rounded-none text-sm font-medium"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="h-11 sm:h-12 px-8 w-full sm:w-auto bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-sm uppercase tracking-wider shrink-0 transition-colors rounded-none active:scale-95 disabled:opacity-75"
              >
                {isSubscribing ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6 sm:pt-6 sm:pb-8">
        {/* Logo and Social Icons Row */}
        <div className="flex flex-row items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-white/10">
          <Link to="/" className="inline-block py-0.5">
            <img
              src={getSetting('logo_white_url') || getSetting('logo_dark_url') || "/logo-white.png"}
              alt={siteName}
              loading="lazy"
              decoding="async"
              className="h-10 sm:h-16 md:h-20 w-auto object-contain max-w-[180px] sm:max-w-[300px]"
            />
          </Link>

          <div className="flex items-center gap-3.5 sm:gap-6 text-white/80">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              const CustomIcon = social.custom;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="hover:text-[#FF5500] text-white transition-colors"
                  aria-label={social.label}
                >
                  {CustomIcon ? <CustomIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : Icon ? <Icon className="w-4 h-4 sm:w-5 sm:h-5" /> : null}
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* Desktop 5-Column Grid (md and up) */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 pt-5 pb-6 sm:pt-6 sm:pb-7">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[15px] sm:text-base font-bold text-white mb-3 tracking-tight">
                {section.title}
              </h4>
              <div className="flex flex-col space-y-2">
                {section.links.map((link) =>
                  link.isExternal ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-[#FF5500] text-[13px] sm:text-sm font-medium transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="text-white/70 hover:text-[#FF5500] text-[13px] sm:text-sm font-medium transition-colors"
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Accordion View (below md) */}
        <div className="md:hidden divide-y divide-white/10 pt-1 pb-4">
          {footerSections.map((section) => {
            const isOpen = openSections.includes(section.title);
            return (
              <div key={section.title} className="py-2.5">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between text-left font-bold text-white text-[15px] py-1 tracking-tight"
                  aria-expanded={isOpen}
                >
                  <span>{section.title}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2.5 pb-2 flex flex-col space-y-2 pl-2 border-l border-[#FF5500]/40 my-1.5">
                        {section.links.map((link) =>
                          link.isExternal ? (
                            <a
                              key={link.label}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white/70 hover:text-[#FF5500] text-sm font-medium transition-colors py-0.5"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              key={link.label}
                              to={link.href}
                              className="text-white/70 hover:text-[#FF5500] text-sm font-medium transition-colors py-0.5"
                            >
                              {link.label}
                            </Link>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Optional Trusted Partners in footer if configured */}
        <TrustedPartnersSection />

        {/* Bottom Bar: Copyright, Legal & Back to Top */}
        <div className="pt-4 sm:pt-5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-white/60 text-center md:text-left">
            {getSetting(
              "footer_text",
              `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-white/60">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="#" className="hover:text-white transition-colors">Terms of Use</Link>
            <span>•</span>
            <span className="text-[#FF5500] font-bold">Registered Agency • Ghana</span>
            <span>•</span>
            <span>Developed by <span className="text-[#FF5500] font-semibold">Oflex Creative</span></span>
          </div>

          <button
            onClick={scrollToTop}
            className="border border-white/30 hover:border-[#FF5500] hover:text-[#FF5500] px-3.5 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors rounded-none flex items-center gap-1.5 text-white/90 cursor-pointer active:scale-95"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};