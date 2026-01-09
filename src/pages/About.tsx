import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';

interface SiteSetting {
  setting_key: string;
  setting_value: string | null;
}

const values = [
  { icon: Target, title: 'Mission', description: 'To empower creators and businesses with premium digital tools and stunning designs that elevate their brand presence.' },
  { icon: Eye, title: 'Vision', description: 'To become the go-to creative studio for innovative digital products and cutting-edge design solutions.' },
  { icon: Heart, title: 'Values', description: 'Quality, creativity, and client satisfaction drive everything we do. We believe in building lasting relationships.' },
  { icon: Lightbulb, title: 'Philosophy', description: 'Every project is an opportunity to push boundaries and create something remarkable that stands out.' },
];

const About = () => {
  const { data: siteSettings = [] } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('setting_key, setting_value');
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  const getSetting = (key: string, defaultValue: string = '') => {
    const setting = siteSettings.find((s) => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                About Us
              </span>
              <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
                {getSetting('about_title', 'Crafting Digital Excellence')}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {getSetting('about_description', 'Oflex Creative is a digital design studio specializing in creating premium visual experiences. From AI-powered prompts to complete brand identities, we bring creative visions to life with precision and artistry.')}
              </p>
              <Button size="lg" asChild>
                <Link to="/contact">
                  Work With Us
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                  alt="Creative team collaboration"
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg"
              >
                <p className="text-3xl font-bold text-primary">5+</p>
                <p className="text-sm text-muted-foreground">Years Experience</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="absolute -top-6 -right-6 bg-card border border-border rounded-xl p-4 shadow-lg"
              >
                <p className="text-3xl font-bold text-primary">200+</p>
                <p className="text-sm text-muted-foreground">Projects Completed</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              badge="Our Story"
              title="The Journey So Far"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="prose prose-lg max-w-none text-center"
            >
              <p className="text-muted-foreground leading-relaxed mb-6">
                What started as a passion for digital design has evolved into a full-service 
                creative studio. Oflex Creative was born from the belief that great design 
                should be accessible to everyone, from startups to established brands.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we combine traditional design principles with cutting-edge AI technology 
                to deliver solutions that are both beautiful and effective. Our digital products 
                have helped countless creators streamline their workflows and achieve stunning results.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="What Drives Us"
            title="Our Core Values"
            description="The principles that guide our creative process"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover={false} className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <value.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-foreground mb-2">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-primary/20">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
                  alt="Founder"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Creative Director</h3>
              <p className="text-primary font-medium mb-4">Founder & Lead Designer</p>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                "Design is not just what it looks like and feels like. Design is how it works. 
                At Oflex Creative, we believe in creating meaningful experiences that resonate 
                with audiences and drive results."
              </p>
            </motion.div>
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
              Ready to Create Something Amazing?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Let's collaborate and bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/contact">
                  Get In Touch
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;