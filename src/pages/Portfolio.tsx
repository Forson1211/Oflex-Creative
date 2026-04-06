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
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-foreground"
                onClick={() => setSelectedItem(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="rounded-2xl overflow-hidden">
                <OptimizedImage
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  width={1200}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="mt-4 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-2">
                  {selectedItem.category}
                </span>
                <h3 className="text-2xl font-semibold text-foreground">{selectedItem.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Portfolio;
