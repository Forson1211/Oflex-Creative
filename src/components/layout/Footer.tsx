 import { Link } from "react-router-dom";
 import { motion } from "framer-motion";
 import { useQuery } from "@tanstack/react-query";
 import {
   Instagram,
   Twitter,
   Linkedin,
   Facebook,
   Youtube,
   ExternalLink,
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

export const Footer = () => {
  const { getSetting } = useSiteSettings();

   // Fetch featured projects
   const { data: featuredProjects = [] } = useQuery({
     queryKey: ["featured-projects-footer"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("featured_projects")
         .select("*")
         .eq("is_featured", true)
         .order("display_order", { ascending: true })
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
     { icon: Youtube, href: getSetting('social_youtube', '#'), label: 'Youtube' },
  ];

  const logoUrl = getSetting('logo_url', '');
   const siteName = getSetting('site_name', 'Oflex Creative');

  return (
     <footer className="bg-[hsl(220,30%,8%)] text-white border-t border-white/10">
      {/* Social Proof Stats */}
      <FooterSocialProof />

       <div className="container mx-auto px-4 py-10">
          {/* Logo and Social Icons Row */}
          <div className="flex items-center justify-between gap-6 mb-8">
            {/* Logo */}
            <Link to="/" className="inline-block">
              <img
                src={logoUrl || "/placeholder.svg"}
                alt={siteName}
                className="h-10 w-auto"
              />
            </Link>
            
            {/* Social Icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-primary-foreground transition-colors"
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
                         className="text-sm text-white/70 hover:text-primary transition-colors"
                       >
                         Our Story
                       </Link>
                       <Link
                         to="/about"
                         className="text-sm text-white/70 hover:text-primary transition-colors"
                       >
                         Team
                       </Link>
                       <Link
                         to="/contact"
                         className="text-sm text-white/70 hover:text-primary transition-colors"
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
                         className="text-sm text-white/70 hover:text-primary transition-colors"
                       >
                         Portfolio
                       </Link>
                       <Link
                         to="/store"
                         className="text-sm text-white/70 hover:text-primary transition-colors"
                       >
                         Store
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
                         className="text-sm text-white/70 hover:text-primary transition-colors"
                       >
                         Prompt Engineering
                       </Link>
                       <Link
                         to="/services"
                         className="text-sm text-white/70 hover:text-primary transition-colors"
                       >
                         Digital Design
                       </Link>
                       <Link
                         to="/services"
                         className="text-sm text-white/70 hover:text-primary transition-colors"
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
                         className="text-sm text-white/70 hover:text-primary transition-colors"
                       >
                         Privacy Policy
                       </Link>
                       <Link
                         to="#"
                         className="text-sm text-white/70 hover:text-primary transition-colors"
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
                 <h4 className="font-semibold text-white mb-4">About</h4>
                 <div className="flex flex-col gap-3">
                   <Link
                     to="/about"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Our Story
                   </Link>
                   <Link
                     to="/about"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Team
                   </Link>
                   <Link
                     to="/contact"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Contact
                   </Link>
                 </div>
               </div>

               <div>
                 <h4 className="font-semibold text-white mb-4">Discover</h4>
                 <div className="flex flex-col gap-3">
                   <Link
                     to="/portfolio"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Portfolio
                   </Link>
                   <Link
                     to="/store"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Store
                   </Link>
                 </div>
               </div>

               <div>
                 <h4 className="font-semibold text-white mb-4">Services</h4>
                 <div className="flex flex-col gap-3">
                   <Link
                     to="/services"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Prompt Engineering
                   </Link>
                   <Link
                     to="/services"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Digital Design
                   </Link>
                   <Link
                     to="/services"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Branding
                   </Link>
                 </div>
               </div>

               <div>
                 <h4 className="font-semibold text-white mb-4">Support</h4>
                 <div className="flex flex-col gap-3">
                   <Link
                     to="#"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Privacy Policy
                   </Link>
                   <Link
                     to="#"
                     className="text-sm text-white/70 hover:text-primary transition-colors"
                   >
                     Terms of Service
                   </Link>
                 </div>
               </div>
             </div>
           </div>

           {/* Right Column - Featured Projects */}
            <div className="lg:col-span-4 xl:col-span-5 lg:pl-8 lg:border-l lg:border-white/10">
             <h4 className="font-semibold text-white mb-4">Featured Projects</h4>
             <div className="space-y-4">
               {featuredProjects.length > 0 ? (
                 featuredProjects.map((project) => (
                   <motion.div
                     key={project.id}
                     whileHover={{ x: 4 }}
                      className="group flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                   >
                     <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                       <img
                         src={project.image_url || "/placeholder.svg"}
                         alt={project.title}
                         className="w-full h-full object-cover"
                       />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h5 className="text-sm font-medium text-white truncate">
                         {project.title}
                       </h5>
                       <p className="text-xs text-white/60">{project.category}</p>
                     </div>
                     <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors flex-shrink-0" />
                   </motion.div>
                 ))
               ) : (
                 <div className="text-sm text-white/60">No featured projects</div>
               )}
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
             <p className="text-sm text-white/40">www.oflexcreative.com</p>
           </div>
         </div>
      </div>
    </footer>
  );
 };