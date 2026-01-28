import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowRight, Star, Tag, MousePointer2, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useProducts } from '@/hooks/useProducts';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export const StoreHeroSlider = () => {
  const { getSetting, currencySymbol } = useSiteSettings();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Fetch products to feature on the store slider
  const { data: products = [] } = useProducts({ isActive: true });

  if (products.length === 0) return null;

  return (
    <section className="w-full pt-8 pb-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
              duration: 60,
            }}
            plugins={[
              Autoplay({
                delay: 6000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {products.map((product, index) => {
                const isActive = current === index;
                return (
                  <CarouselItem key={product.id}>
                    <Link to={`/product/${product.id}`} className="block group">
                      <GlassCard className="p-0 border-white/10 overflow-hidden bg-[#1a1a1a]/90 backdrop-blur-xl">
                        <div className="grid lg:grid-cols-2 lg:h-[480px] gap-0">
                          {/* Image Side */}
                          <div className="relative aspect-video lg:aspect-auto overflow-hidden">
                            <motion.div
                              animate={{ scale: isActive ? 1.05 : 1 }}
                              transition={{ duration: 6, ease: "linear" }}
                              className="w-full h-full"
                            >
                              <OptimizedImage
                                src={product.image_url || ''}
                                alt={product.title}
                                width={1200}
                                className="w-full h-full"
                                imageClassName="object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            </motion.div>
                            <div className="absolute top-6 left-6">
                              <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full border-none shadow-xl font-bold text-xs uppercase tracking-[0.2em]">
                                Featured Asset
                              </Badge>
                            </div>
                          </div>

                          {/* Content Side */}
                          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white/[0.02]">
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="flex items-center gap-2 mb-6"
                            >
                              <span className="text-xs font-bold text-primary tracking-[0.2em] uppercase">{product.category}</span>
                              <span className="w-1 h-1 bg-primary/30 rounded-full" />
                              <span className="text-xs font-bold text-muted-foreground/60 tracking-[0.2em] uppercase">Premium Release</span>
                            </motion.div>

                            <motion.h2
                              initial={{ opacity: 0, y: 30 }}
                              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight group-hover:text-primary transition-colors duration-300 leading-tight"
                            >
                              {product.title}
                            </motion.h2>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                              transition={{ duration: 0.8, delay: 0.4 }}
                              className="flex items-center gap-4 mb-8"
                            >
                              <span className="text-2xl font-bold text-foreground">{currencySymbol}{product.price.toFixed(2)}</span>
                              <div className="h-1 w-12 bg-primary/20 rounded-full" />
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                              </div>
                            </motion.div>

                            <motion.p
                              initial={{ opacity: 0, y: 20 }}
                              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                              transition={{ duration: 0.8, delay: 0.5 }}
                              className="text-lg text-muted-foreground/80 leading-relaxed mb-10 line-clamp-3"
                            >
                              {product.description || "An exclusive digital resource from Oflex Creative Studio, designed to push the boundaries of digital craft and creative excellence."}
                            </motion.p>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                              transition={{ duration: 0.8, delay: 0.6 }}
                              className="flex items-center justify-between mt-auto"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                                  <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">Oflex Studio</span>
                                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Verified Asset</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hidden sm:flex">
                                  Buy Now
                                  <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest group/btn sm:hidden">
                                  <span>View Details</span>
                                  <ChevronRightIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="left-8 z-20 border-white/10 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white" />
              <CarouselNext className="right-8 z-20 border-white/10 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};
