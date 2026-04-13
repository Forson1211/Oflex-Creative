import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ShoppingBag } from 'lucide-react';
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
    queryKey: ['projects', 'portfolio'], // Aligned with PROJECT_KEYS for invalidation
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
    const cats = new Set(portfolioItems.map(item => item.category));
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
      // Profiles are usually not directly embeddable as interactive designs,
      // but we'll try to handle typical design URLs if they appear.
    }
    
    // PosterMyWall detection
    if (url.includes('postermywall.com')) {
      // Handle design links like /index.php/d/...
      if (url.includes('/index.php/d/')) {
        const id = url.split('/d/')[1]?.split('?')[0];
        if (id) {
          return `https://www.postermywall.com/index.php/poster/embed/${id}`;
        }
      }
      // Standard embed links
      if (url.includes('/poster/embed/')) {
        return url;
      }
    }

    return null;
  };

  const embedUrl = useMemo(() => getEmbedUrl(selectedItem?.project_url || null), [selectedItem]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-[#FDFBF7] dark:bg-background/50 border-b border-border/10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
            >
              <h1 className="font-sans text-5xl md:text-6xl lg:text-[4rem] font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Check out<br className="hidden md:block" />
                our most recent<br className="hidden md:block" />
                Projects.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Browse through some of our recent projects to learn more about what we've done.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Button className="bg-[#FF6B35] hover:bg-[#E85D2A] text-white px-10 h-14 text-base font-bold rounded-sm border-none shadow-sm transition-colors" asChild>
                  <Link to="/contact">Get Started</Link>
                </Button>
                <Button className="bg-[#1F0833] hover:bg-[#2c0b47] dark:bg-white dark:hover:bg-white/90 text-white dark:text-black px-10 h-14 text-base font-bold rounded-sm border-none shadow-sm transition-colors" asChild>
                  <Link to="/store">Visit Shop</Link>
                </Button>
              </div>
            </motion.div>

            {/* Illustration */}
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="relative lg:h-[450px] flex justify-center items-center"
            >
               {/* We can use a setting or a placeholder for now */}
               <img 
                 src={getSetting('portfolio_hero_image', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800')} 
                 alt="Our recent projects" 
                 className="w-full max-w-md lg:max-w-full h-auto max-h-[80%] object-contain drop-shadow-xl" 
               />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter & Gallery */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
          >
            {isLoading ? (
              // Filter Loading State
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-full" />
              ))
            ) : (
              categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))
            )}
          </motion.div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="h-full"
                  >
                    <div className="bg-white dark:bg-card rounded-xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-border/40 h-full flex flex-col group">
                      <div className="relative aspect-video overflow-hidden border-b border-border/10 cursor-pointer" onClick={() => setSelectedItem(item)}>
                        <OptimizedImage
                          src={item.image_url}
                          alt={item.title}
                          width={600}
                          className="w-full h-full"
                          imageClassName="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black font-bold uppercase tracking-widest text-[10px]">
                               Expand Project
                            </Button>
                         </div>
                      </div>
                      
                      <div className="p-6 md:p-8 flex flex-col flex-1 bg-white dark:bg-card">
                        <h3 className="text-xl font-bold text-foreground mb-4 font-roboto">{item.title}</h3>
                        
                        <div className="mt-auto pt-2">
                          <Button 
                            className="bg-[#FF6B35] hover:bg-[#E85D2A] text-white px-8 font-bold rounded-sm h-10 w-fit transition-colors shadow-sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            View Project
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-foreground bg-background/50 backdrop-blur-md hover:bg-background/80"
                onClick={() => setSelectedItem(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid lg:grid-cols-[1fr_350px] divide-x divide-border">
                  {/* Visual Content */}
                  <div className="p-0 bg-muted/20">
                    {embedUrl ? (
                      <div className="relative aspect-video lg:aspect-auto lg:h-full min-h-[400px]">
                        <iframe
                          src={embedUrl}
                          className="absolute inset-0 w-full h-full border-0"
                          allowFullScreen
                          loading="lazy"
                          title={selectedItem.title}
                        />
                      </div>
                    ) : (
                      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
                        <OptimizedImage
                          src={selectedItem.image_url}
                          alt={selectedItem.title}
                          width={1200}
                          className="w-full h-auto shadow-sm"
                          priority
                        />
                      </div>
                    )}
                  </div>

                  {/* Info Panel */}
                  <div className="p-8 space-y-8 bg-card flex flex-col h-full">
                    <div className="space-y-4">
                      <span className="inline-block px-3 py-1 rounded-none bg-[#FF6B35]/10 text-[#FF6B35] text-[10px] font-black uppercase tracking-widest border border-[#FF6B35]/20">
                        {selectedItem.category}
                      </span>
                      <h3 className="text-3xl font-black text-foreground leading-tight uppercase tracking-tight">{selectedItem.title}</h3>
                      <div className="h-1 w-12 bg-[#FF6B35]" />
                    </div>

                    <div className="flex-grow">
                      <p className="text-muted-foreground leading-relaxed text-[15px]">
                        {selectedItem.description || "Detailed project documentation and creative walkthrough."}
                      </p>
                    </div>
                    
                    <div className="space-y-4 pt-8 border-t border-border">
                      {selectedItem.project_url && (
                        <Button asChild className="w-full bg-[#1A1028] hover:bg-[#251838] dark:bg-white dark:hover:bg-white/90 text-white dark:text-black font-bold h-12 rounded-sm shadow-sm transition-all group">
                          <a href={selectedItem.project_url} target="_blank" rel="noopener noreferrer">
                            Visit Live Project
                            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedItem(null)}
                        className="w-full border-border/50 hover:bg-muted font-bold h-12 rounded-sm transition-all"
                      >
                         Return to Portfolio
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
