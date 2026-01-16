import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
}

export const HeroBannerSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: slides = [] } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
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

  // Auto-advance slides every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [slides.length, nextSlide]);

  if (slides.length === 0) return null;

  return (
    <div className="w-full">
      {/* Banner Slider - Full width and responsive height */}
      <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            <motion.img
              src={slides[currentIndex]?.image_url}
              alt="Banner slide"
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: 1.05 }}
              transition={{ duration: 8, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons - sleek design */}
        {slides.length > 1 && (
          <>
            <motion.button
              onClick={prevSlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-md border border-border/30 flex items-center justify-center text-foreground hover:bg-background/40 transition-all duration-300"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
            <motion.button
              onClick={nextSlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-md border border-border/30 flex items-center justify-center text-foreground hover:bg-background/40 transition-all duration-300"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>

            {/* Dots Indicator - modern pill style */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-background/20 backdrop-blur-md">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
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
  );
};
