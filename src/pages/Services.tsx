import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, Palette, Code, Zap, Layers, Wand2, Camera, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';


const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Palette,
  Code,
  Zap,
  Layers,
  Wand2,
  Camera,
  Smartphone
};

const Services = () => {
  const { getSetting } = useSiteSettings();
  // Hardcoded content as fallback or base
  const services = [
    { id: '1', icon: 'Code', title: 'Development', description: 'Full-Stack Engineering for Web & Mobile. We build robust websites, scalable web apps, custom software, and native mobile applications tailored to your business logic.', features: ['Full-Stack Web Dev', 'Mobile App Dev', 'Custom Software', 'Scalable Systems'] },
    { id: '2', icon: 'Palette', title: 'Graphic Design', description: 'Strategic UI/UX & Visual Identity. We design intuitive user interfaces and striking brand visuals that bridge the gap between aesthetic beauty and functional performance.', features: ['UI/UX Design', 'Visual Identity', 'Brand Graphics', 'Creative Direction'] },
    { id: '3', icon: 'Camera', title: 'Photography', description: 'Professional Visual Storytelling. High-quality commercial and product photography designed to elevate your brand’s aesthetic and showcase your work with professional clarity.', features: ['Commercial Photo', 'Product Shoots', 'Brand Imagery', 'Visual clarity'] },
  ];
  const isLoading = false;

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
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-[12px] uppercase font-bold tracking-[0.2em] mb-6">
              {getSetting('services_badge', 'Our Expertise')}
            </span>
            <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              {getSetting('services_title', 'Comprehensive Creative Solutions')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/90 mb-8 text-center px-4 sm:px-0">
              {getSetting('services_description', 'We combine strategic thinking with creative excellence to deliver results that elevate your brand and engage your audience.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 pb-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading services...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Sparkles;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="bg-white dark:bg-card rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-border/40 h-full group hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1)] transition-all duration-300">
                      <div className="mb-8">
                        <IconComponent className="w-16 h-16 text-primary transition-transform duration-500 group-hover:scale-110" />
                      </div>

                      <h3 className="text-2xl font-bold text-[#1A1028] dark:text-white mb-4 font-roboto">
                        {service.title}
                      </h3>

                      <p className="text-[15px] leading-relaxed text-muted-foreground mb-8">
                        {service.description}
                      </p>

                      <ul className="space-y-3 mb-10 text-left w-full max-w-[240px] mx-auto">
                        {(service.features || []).map((feature: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-black dark:text-white/80">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto">
                        <Button
                          className="bg-primary hover:bg-primary/90 text-white px-10 py-6 rounded-none font-bold text-base transition-all duration-300 shadow-sm"
                          asChild
                        >
                          <Link to="/contact">
                            Get In Touch
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge={getSetting('services_process_badge', 'Our Method')}
            title={getSetting('services_process_title', 'How We Work')}
            description={getSetting('services_process_description', 'A transparent and collaborative approach to every project')}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Discovery', description: 'Understanding your needs, goals, and vision' },
              { step: '02', title: 'Strategy', description: 'Creating a tailored plan for your project' },
              { step: '03', title: 'Creation', description: 'Bringing your vision to life with precision' },
              { step: '04', title: 'Delivery', description: 'Final review and handover of your assets' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              {getSetting('services_cta_title', 'Have a Project in Mind?')}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {getSetting('services_cta_description', "We're always excited to discuss new ideas and help bring them to life. Let's start building your next success story.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 rounded-none" asChild>
                <Link to="/contact">
                  Start a Project
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-none" asChild>
                <Link to="/store">Browse Products</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
