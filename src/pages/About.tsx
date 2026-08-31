import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, Lightbulb, Sparkles, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  display_order: number;
}



const About = () => {
  const { getSetting } = useSiteSettings();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

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

  const dynamicValues = [
    { icon: Target, title: getSetting('about_mission_title', 'Mission'), description: getSetting('about_mission_desc', 'To empower creators and businesses with premium digital tools and stunning designs that elevate their brand presence.') },
    { icon: Eye, title: getSetting('about_vision_title', 'Vision'), description: getSetting('about_vision_desc', 'To become the go-to creative studio for innovative digital products and cutting-edge design solutions.') },
    { icon: Heart, title: getSetting('about_core_values_title', 'Values'), description: getSetting('about_core_values_desc', 'Quality, creativity, and client satisfaction drive everything we do. We believe in building lasting relationships.') },
    { icon: Lightbulb, title: getSetting('about_philosophy_title', 'Philosophy'), description: getSetting('about_philosophy_desc', 'Every project is an opportunity to push boundaries and create something remarkable that stands out.') },
  ];

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
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-muted/20 aspect-video">
                {(getSetting('about_main_image', '').toLowerCase().match(/\.(mp4|webm|ogg|mov|m4v|mkv)$/) || getSetting('about_main_image', '').includes('video')) ? (
                  <video
                    src={getSetting('about_main_image', '')}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <OptimizedImage
                    src={getSetting('about_main_image', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')}
                    alt="About Oflex"
                    width={800}
                    className="w-full h-auto"
                    imageClassName="object-contain"
                    priority
                  />
                )}
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

      {/* Values Section */}
      <section className="py-20 sm:py-28 bg-slate-50/50 dark:bg-[#120B1D] relative overflow-hidden border-b border-slate-200/60 dark:border-white/5">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-[#FF5500]/25 text-[#FF5500] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{getSetting('about_values_badge', 'What Drives Us')}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-lato mb-4">
              {getSetting('about_values_title', 'Our Core Values')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              {getSetting('about_values_description', 'The principles that guide our creative process')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {dynamicValues.map((value, index) => {
              const numStr = String(index + 1).padStart(2, '0');
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group relative bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-xl hover:border-[#FF5500]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top-right watermark number */}
                  <span className="absolute top-4 right-5 text-4xl font-black text-slate-100 dark:text-white/5 font-lato pointer-events-none group-hover:text-[#FF5500]/15 transition-colors">
                    {numStr}
                  </span>

                  <div className="flex items-start gap-4 sm:gap-5 relative z-10">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-orange-50 dark:bg-white/5 border border-orange-100 dark:border-white/10 flex items-center justify-center flex-shrink-0 text-[#FF5500] group-hover:bg-[#FF5500] group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-xs">
                      <value.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-2 group-hover:text-[#FF5500] transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <section className="py-20 sm:py-28 bg-white dark:bg-background relative overflow-hidden border-b border-slate-200/60 dark:border-white/5">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-[#FF5500]/25 text-[#FF5500] text-xs font-bold uppercase tracking-wider mb-4">
                <Users className="w-3.5 h-3.5" />
                <span>{getSetting('about_team_badge', 'Masterminds')}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-lato mb-4">
                {getSetting('about_team_title', 'Meet the Team')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                {getSetting('about_team_description', 'The creative minds behind our exceptional digital experiences.')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {teamMembers.map((member, index) => {
                const initial = member.name?.trim().charAt(0).toUpperCase() || 'M';
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-none p-6 sm:p-7 flex flex-col items-center text-center shadow-xs hover:shadow-lg transition-all duration-300 group h-full"
                  >
                    {/* Circle Avatar */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-5 bg-[#0B253A] flex items-center justify-center text-white text-3xl font-black shadow-xs flex-shrink-0 border-2 border-slate-100 dark:border-white/10">
                      {member.image_url ? (
                        <img
                          src={getOptimizedImageUrl(member.image_url, 300)}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-[#0B253A] dark:text-white text-base sm:text-lg mb-1 leading-snug">
                      {member.name}
                    </h3>

                    {/* Role */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-snug min-h-[2.5rem] flex items-center justify-center">
                      {member.role}
                    </p>

                    {/* Learn More Button */}
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="w-full py-2.5 px-4 bg-[#0B253A] hover:bg-[#071927] dark:bg-[#0B253A] dark:hover:bg-[#FF5500] text-white text-xs font-black uppercase tracking-wider rounded-none mt-auto transition-colors shadow-xs active:scale-95"
                    >
                      LEARN MORE
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Member Bio Dialog */}
          <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
            <DialogContent className="max-w-md bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/10 rounded-none p-6 sm:p-8">
              {selectedMember && (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0B253A] flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-[#FF5500]">
                    {selectedMember.image_url ? (
                      <img
                        src={getOptimizedImageUrl(selectedMember.image_url, 300)}
                        alt={selectedMember.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{selectedMember.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-900 dark:text-white mb-1">
                      {selectedMember.name}
                    </h4>
                    <p className="text-xs font-bold text-[#FF5500] uppercase tracking-wider">
                      {selectedMember.role}
                    </p>
                  </div>
                  <div className="w-full pt-4 border-t border-slate-100 dark:border-white/10 text-left">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedMember.bio || 'Passionate about digital innovation, branding, and creative design solutions.'}
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </section>
      )}
    </Layout>
  );
};

export default About;
