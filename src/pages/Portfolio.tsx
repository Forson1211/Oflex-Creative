import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

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
  const { data: portfolioItems = [] } = useQuery({
    queryKey: ['portfolio-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_projects')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as FeaturedProject[];
    },
  });

  // Extract unique categories from projects
  const categories = useMemo(() => {
    const cats = new Set(portfolioItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [portfolioItems]);

  const filteredItems = activeCategory === 'All'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === activeCategory);

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
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              {getSetting('portfolio_badge', 'Portfolio')}
            </span>
            <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              {getSetting('portfolio_title', 'Our Creative Work')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {getSetting('portfolio_description', 'Explore our diverse portfolio of design projects, from brand identities to digital interfaces and AI-generated art.')}
            </p>
          </motion.div>
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
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </motion.div>

          {/* Gallery Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
                >
                  <GlassCard
                    className="overflow-hidden p-0 group cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-2">
                            {item.category}
                          </span>
                          <h3 className="text-foreground font-semibold">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="w-full h-auto"
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
