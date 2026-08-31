import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowUpRight, ExternalLink, Eye, Sparkles, Globe, Layers, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

interface FeaturedProject {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  project_url: string | null;
  is_featured: boolean;
  display_order: number;
}

const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<FeaturedProject | null>(null);
  const { getSetting } = useSiteSettings();

  // Fetch all featured projects from database
  const { data: portfolioItems = [], isLoading } = useQuery<FeaturedProject[]>({
    queryKey: ['projects', 'portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_projects')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as FeaturedProject[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract unique categories from projects
  const categories = useMemo<string[]>(() => {
    const cats = new Set(portfolioItems.map(item => item.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [portfolioItems]);

  const filteredItems = useMemo(() => {
    return activeCategory === 'All'
      ? portfolioItems
      : portfolioItems.filter(item => item.category === activeCategory);
  }, [activeCategory, portfolioItems]);

  // Helper to check if a URL is embeddable (Canva, PosterMyWall, etc.)
  const getEmbedUrl = (url: string | null) => {
    if (!url) return null;
    
    // Canva detection
    if (url.includes('canva.com')) {
      if (url.includes('/design/')) {
        const baseUrl = url.split('?')[0];
        return `${baseUrl}/view?embed`;
      }
    }
    
    // PosterMyWall detection
    if (url.includes('postermywall.com')) {
      if (url.includes('/index.php/d/')) {
        const id = url.split('/d/')[1]?.split('?')[0];
        if (id) {
          return `https://www.postermywall.com/index.php/poster/embed/${id}`;
        }
      }
      if (url.includes('/poster/embed/')) {
        return url;
      }
    }

    return null;
  };

  const portfolioBgImage = getSetting('portfolio_hero_bg_image') || getSetting('portfolio_hero_image') || getSetting('portfolio_banner_image') || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1600';
  const portfolioBgOverlay = Number(getSetting('portfolio_hero_overlay_opacity', '80')) / 100;

  return (
    <Layout>
      {/* Hero Section */}
      <section 
        className="relative py-16 sm:py-24 lg:py-28 bg-slate-900 border-b border-slate-200/60 dark:border-white/5 overflow-hidden flex items-center"
        style={{
          backgroundImage: `url(${portfolioBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark Gradient Overlay for readability */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/40 backdrop-blur-[1px]"
          style={{ opacity: portfolioBgOverlay }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl text-left space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight font-lato">
              Our Featured <br className="hidden sm:block" />
              <span className="text-[#FF5500]">Projects & Softwares.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-lg">
              Explore our curated portfolio of bespoke software platforms, high-performance web systems, and creative digital solutions.
            </p>

            <div className="flex flex-wrap items-center justify-start gap-4 pt-2">
              <Button 
                className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-8 h-12 text-sm font-bold rounded-none shadow-lg shadow-[#FF5500]/25 transition-all hover:scale-105 active:scale-95" 
                asChild
              >
                <Link to="/contact">
                  Start a Project
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button 
                className="bg-white hover:bg-slate-100 text-slate-900 px-8 h-12 text-sm font-bold rounded-none shadow-md transition-all hover:scale-105 active:scale-95 border-0" 
                asChild
              >
                <Link to="/store">Visit Store</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter & Gallery Section */}
      <section className="py-14 sm:py-20 bg-slate-50/50 dark:bg-background">
        <div className="container mx-auto px-4">
          {/* Category Filter Pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-12 sm:mb-14"
          >
             {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-28 bg-slate-200 dark:bg-white/5 animate-pulse rounded-full" />
              ))
            ) : (
              categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/25'
                        : 'bg-white dark:bg-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#FF5500]/40 hover:text-[#FF5500]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })
            )}
          </motion.div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => {
                  const hasExternalUrl = Boolean(item.project_url);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xs hover:shadow-2xl hover:border-[#FF5500]/40 transition-all duration-500 group h-full cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Modern Image Container with Browser Aspect */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                        {item.image_url ? (
                          <OptimizedImage
                            src={item.image_url}
                            alt={item.title}
                            width={650}
                            className="w-full h-full"
                            imageClassName="object-cover w-full h-full transform transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-[#1A1028] flex items-center justify-center p-6 text-center">
                            <span className="text-xl font-black text-white uppercase tracking-wider">{item.title}</span>
                          </div>
                        )}

                        {/* Floating Category Tag */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/75 dark:bg-black/85 backdrop-blur-md text-white text-[11px] font-bold tracking-wide uppercase shadow-sm border border-white/15">
                            {item.category || 'Live Project'}
                          </span>
                        </div>

                        {/* Floating Preview Button */}
                        <div className="absolute top-3 right-3 z-10">
                          <div className="w-9 h-9 rounded-full bg-white/95 dark:bg-[#1A1028]/95 backdrop-blur-md text-slate-800 dark:text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 border border-slate-200/60 dark:border-white/15">
                            <Eye className="w-4 h-4 text-[#FF5500]" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-6 sm:p-7 flex flex-col flex-grow">
                        {/* Title */}
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-[#FF5500] transition-colors mb-2 text-left line-clamp-1">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-600 dark:text-muted-foreground text-[13px] sm:text-sm leading-relaxed line-clamp-2 text-left mb-6 flex-grow">
                          {item.description || "An innovative digital solution engineered to empower operations with seamless performance and modern design."}
                        </p>
                        
                        {/* Bottom Row Actions */}
                        <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between mt-auto">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF5500]">
                            <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
                            Live Platform
                          </span>

                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#FF5500] transition-colors">
                            <span>View Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox / Project Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 z-50 p-2 rounded-full text-slate-700 dark:text-white bg-white/80 dark:bg-black/60 backdrop-blur-md hover:bg-white dark:hover:bg-black transition-all shadow-md"
                onClick={() => setSelectedItem(null)}
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid lg:grid-cols-[1fr_360px] divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-white/10">
                  {/* Visual Content */}
                  <div className="p-0 bg-slate-50 dark:bg-black/20 flex items-center justify-center min-h-[350px]">
                    {embedUrl ? (
                      <div className="relative aspect-video w-full h-full min-h-[400px]">
                        <iframe
                          src={embedUrl}
                          className="absolute inset-0 w-full h-full border-0"
                          allowFullScreen
                          loading="lazy"
                          title={selectedItem.title}
                        />
                      </div>
                    ) : (
                      <div className="p-6 md:p-10 w-full">
                        <OptimizedImage
                          src={selectedItem.image_url}
                          alt={selectedItem.title}
                          width={1200}
                          className="w-full h-auto rounded-lg shadow-md"
                          priority
                        />
                      </div>
                    )}
                  </div>

                  {/* Info Panel */}
                  <div className="p-6 sm:p-8 bg-white dark:bg-[#1A1028] flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] text-xs font-bold uppercase tracking-wider border border-[#FF5500]/20">
                        {selectedItem.category || 'Featured'}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                        {selectedItem.title}
                      </h3>
                      <div className="h-1 w-12 bg-[#FF5500] rounded-full" />
                    </div>

                    <div className="flex-grow">
                      <p className="text-slate-600 dark:text-muted-foreground leading-relaxed text-sm sm:text-base">
                        {selectedItem.description || "Detailed project documentation and creative digital walkthrough."}
                      </p>
                    </div>
                    
                    <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10">
                      {selectedItem.project_url && (
                        <Button 
                          asChild 
                          className="w-full bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold h-12 rounded-none shadow-lg shadow-[#FF5500]/25 transition-all"
                        >
                          <a href={selectedItem.project_url} target="_blank" rel="noopener noreferrer">
                            Visit Live Project
                            <ArrowUpRight className="ml-2 w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedItem(null)}
                        className="w-full border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold h-12 rounded-none transition-all"
                      >
                         Close Preview
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Portfolio;
