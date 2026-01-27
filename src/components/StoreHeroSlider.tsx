import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getOptimizedImageUrl, generateSrcSet } from '@/lib/image-optimizer';

interface StoreSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
}

export const StoreHeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { getSetting } = useSiteSettings();

  const imageFit = (getSetting('store_slider_image_fit', 'cover') || 'cover').toLowerCase();
  const imgFitClass = imageFit === 'contain' ? 'object-contain' : 'object-cover';

  const { data: slides = [] } = useQuery({
    queryKey: ['store-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as StoreSlide[];
    },
  });

  const nextSlide = useCallback(() => {
    if (slides.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  }, [slides.length]);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [slides.length, nextSlide]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <section className="w-full pt-6 md:pt-10">
      <div className="container mx-auto px-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="group relative h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0"
              >
                {/* Background Image with Ken Burns effect */}
                <motion.img
                  src={getOptimizedImageUrl(currentSlide?.image_url, 1000)}
                  srcSet={generateSrcSet(currentSlide?.image_url)}
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  alt="Store banner"
                  loading={currentIndex === 0 ? "eager" : "lazy"}
                  decoding={currentIndex === 0 ? "sync" : "async"}
                  className={`w-full h-full ${imgFitClass} object-center`}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.05 }}
                  transition={{ duration: 10, ease: "linear" }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />

                {/* Content */}
                {(currentSlide?.title || currentSlide?.subtitle || currentSlide?.button_text) && (
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-4">
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="max-w-lg"
                      >
                        {currentSlide?.title && (
                          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 md:mb-4">
                            {currentSlide.title}
                          </h2>
                        )}
                        {currentSlide?.subtitle && (
                          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                            {currentSlide.subtitle}
                          </p>
                        )}
                        {currentSlide?.button_text && currentSlide?.button_link && (
                          <Button asChild size="lg">
                            <Link to={currentSlide.button_link}>
                              {currentSlide.button_text}
                            </Link>
                          </Button>
                        )}
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {slides.length > 1 && (
              <>
                <motion.button
                  onClick={prevSlide}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/20 backdrop-blur-md border border-border/30 flex items-center justify-center text-foreground hover:bg-background/40 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>
                <motion.button
                  onClick={nextSlide}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/20 backdrop-blur-md border border-border/30 flex items-center justify-center text-foreground hover:bg-background/40 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-background/20 backdrop-blur-md border border-border/20">
                  {slides.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                        ? 'bg-primary w-6'
                        : 'bg-foreground/40 w-2 hover:bg-foreground/60'
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
