import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getOptimizedImageUrl, generateSrcSet } from '@/lib/image-optimizer';
import { Button } from '@/components/ui/button';

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
  const { getSetting } = useSiteSettings();

  const imageFit = (getSetting('hero_slider_image_fit', 'cover') || 'cover').toLowerCase();
  const imgFitClass = imageFit === 'contain' ? 'object-contain' : 'object-cover';

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
      {/* Full-width banner, no container padding */}
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[560px] w-full overflow-hidden group">
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
              src={getOptimizedImageUrl(slides[currentIndex]?.image_url, 1600)}
              srcSet={generateSrcSet(slides[currentIndex]?.image_url)}
              sizes="100vw"
              alt={slides[currentIndex]?.title || "Banner slide"}
              loading={currentIndex === 0 ? "eager" : "lazy"}
              decoding={currentIndex === 0 ? "sync" : "async"}
              {...(currentIndex === 0 ? { fetchpriority: "high" } : {})}
              className={`absolute inset-0 w-full h-full ${imgFitClass} object-[60%_center] md:object-center transition-all duration-700 scale-[1.15] md:scale-100`}
              initial={{ scale: 1 }}
              animate={{ scale: 1.15 }}
              transition={{ duration: 8, ease: "linear" }}
            />

            {/* Deeper high-contrast gradient overlay — fades right aggressively */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1028]/100 via-[#1a1028]/60 to-transparent pointer-events-none" />

            {/* Precise Subject-Aware Content Layer */}
            <div className="absolute inset-0 z-10 flex items-center py-12 md:py-0">
              <div className="container mx-auto px-4">
                <div className="max-w-[210px] sm:max-w-[450px] md:max-w-[750px]">
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-white text-2xl sm:text-4xl md:text-5xl lg:text-[62px] font-black leading-[1.1] md:leading-[1.05] mb-4 md:mb-6 tracking-tighter drop-shadow-2xl"
                  >
                    Professional Design, <span className="text-primary">Made Simple.</span>
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-white/90 text-[10px] sm:text-base md:text-xl mb-8 md:mb-10 leading-relaxed font-medium drop-shadow-lg"
                  >
                    Get high-end Canva templates and digital assets from Oflex Creative.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <Button className="h-10 sm:h-14 px-6 sm:px-10 bg-primary hover:bg-primary/90 text-white font-black text-sm sm:text-lg rounded-none shadow-[0_15px_40px_rgba(255,107,53,0.3)] transition-all hover:scale-105 active:scale-95 group" asChild>
                      <Link to="/store">
                        Shop Collection
                        <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 ml-2 md:ml-3 group-hover:translate-x-2 transition-transform" />
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {slides.length > 1 && (
          <>
            <motion.button
              onClick={prevSlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/20 backdrop-blur-md border border-border/30 flex items-center justify-center text-white hover:bg-background/40 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
            <motion.button
              onClick={nextSlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/20 backdrop-blur-md border border-border/30 flex items-center justify-center text-white hover:bg-background/40 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                    ? 'bg-[#ff6b35] w-6'
                    : 'bg-white/40 w-2 hover:bg-white/60'
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
