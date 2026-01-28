import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  display_order: number;
}

const values = [
  { icon: Target, title: 'Mission', description: 'To empower creators and businesses with premium digital tools and stunning designs that elevate their brand presence.' },
  { icon: Eye, title: 'Vision', description: 'To become the go-to creative studio for innovative digital products and cutting-edge design solutions.' },
  { icon: Heart, title: 'Values', description: 'Quality, creativity, and client satisfaction drive everything we do. We believe in building lasting relationships.' },
  { icon: Lightbulb, title: 'Philosophy', description: 'Every project is an opportunity to push boundaries and create something remarkable that stands out.' },
];

const About = () => {
  const { getSetting } = useSiteSettings();

  // Fetch team members from database
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;

      // Strict sort: CEO/Founder always first, then by display_order
      return (data as TeamMember[]).sort((a, b) => {
        const aHigher = (role: string) => role.toLowerCase().includes('ceo') || role.toLowerCase().includes('founder') || role.toLowerCase().includes('director');
        const aIsHigher = aHigher(a.role);
        const bIsHigher = aHigher(b.role);

        if (aIsHigher && !bIsHigher) return -1;
        if (!aIsHigher && bIsHigher) return 1;
        return a.display_order - b.display_order;
      });
    },
  });

  const storyParagraphs = getSetting('about_story', '').split('\n\n').filter(p => p.trim());

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
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-[12px] uppercase font-bold tracking-[0.2em] mb-6">
                {getSetting('about_badge', 'About Us')}
              </span>
              <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
                {getSetting('about_title', 'Crafting Digital Excellence')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground/90 mb-8 leading-relaxed px-4 sm:px-0">
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
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative lg:ml-auto"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <OptimizedImage
                  src={getSetting('about_main_image', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')}
                  alt="About Oflex"
                  width={800}
                  className="w-full h-full"
                  imageClassName="object-cover"
                  priority
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg"
              >
                <p className="text-3xl font-bold text-primary">{getSetting('about_years_experience', '5+')}</p>
                <p className="text-sm text-muted-foreground">Years Experience</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="absolute -top-6 -right-6 bg-card border border-border rounded-xl p-4 shadow-lg"
              >
                <p className="text-3xl font-bold text-primary">{getSetting('about_projects_completed', '200+')}</p>
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
              badge={getSetting('about_story_badge', 'Our Story')}
              title={getSetting('about_story_title', 'The Journey So Far')}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="prose prose-lg max-w-none text-center"
            >
              {storyParagraphs.length > 0 ? (
                storyParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground leading-relaxed mb-6 last:mb-0">
                    {paragraph}
                  </p>
                ))
              ) : (
                <>
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
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge={getSetting('about_values_badge', 'What Drives Us')}
            title={getSetting('about_values_title', 'Our Core Values')}
            description={getSetting('about_values_description', 'The principles that guide our creative process')}
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

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <section className="py-24 bg-card/30 relative overflow-hidden">
          <div className="container mx-auto px-4 relative">
            <SectionHeading
              badge={getSetting('about_team_badge', 'Masterminds')}
              title={getSetting('about_team_title', 'Meet the Team')}
              description={getSetting('about_team_description', 'The creative minds behind our exceptional digital experiences.')}
            />

            <div className={`grid gap-6 ${teamMembers.length === 1 ? 'max-w-md mx-auto' :
                teamMembers.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:max-w-6xl mx-auto'
              }`}>
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <GlassCard className="h-full p-6 flex flex-col items-center text-center border-primary/5 hover:border-primary/20 transition-all duration-300 hover:bg-card/50">
                    {/* Compact Avatar with Subtle Glow */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden relative z-10 p-0.5 bg-gradient-to-tr from-primary/40 to-accent/40 shadow-xl">
                        <div className="w-full h-full rounded-full overflow-hidden bg-background">
                          <img
                            src={getOptimizedImageUrl(member.image_url || '', 300)}
                            alt={member.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 items-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/5 text-primary text-[9px] font-bold tracking-[0.15em] uppercase mb-2 border border-primary/10">
                        {member.role}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 tracking-tight">
                        {member.name}
                      </h3>

                      {member.bio && (
                        <p className="text-muted-foreground leading-relaxed text-sm line-clamp-4 italic border-t border-primary/5 pt-4">
                          "{member.bio}"
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

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
              {getSetting('about_cta_title', 'Ready to Create Something Amazing?')}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {getSetting('about_cta_description', "Let's collaborate and bring your vision to life.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-56 sm:w-auto" asChild>
                <Link to="/contact">
                  Get In Touch
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-56 sm:w-auto" asChild>
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
