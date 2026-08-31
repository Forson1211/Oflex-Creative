import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ExternalLink, Globe, Sparkles, Palette, Code, Zap, Layers, Wand2, Star, ShoppingBag, ShoppingCart, Users, Package, Briefcase, Share2, ChevronRight, ChevronLeft, Camera, Smartphone, Quote, Heart, Check, BadgeCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useProducts } from '@/hooks/useProducts';
import { useProjects } from '@/hooks/useProjects';
import { useTestimonials } from '@/hooks/useTestimonials';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { HeroBannerSlider } from '@/components/HeroBannerSlider';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { useServices } from '@/hooks/useServices';
import { TrustedBySection } from '@/components/layout/TrustedBySection';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";



interface SiteStats {
  productCount: number;
  userCount: number;
  projectCount: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Palette,
  Code,
  Zap,
  Layers,
  Wand2,
  Camera,
  Smartphone
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getSetting, currencySymbol } = useSiteSettings();
  const [productApi, setProductApi] = useState<CarouselApi>();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [productSnapCount, setProductSnapCount] = useState(0);
  const [projectApi, setProjectApi] = useState<CarouselApi>();
  const [currentProject, setCurrentProject] = useState(0);
  const [testimonialApi, setTestimonialApi] = useState<CarouselApi>();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [testimonialCount, setTestimonialCount] = useState(0);

  useEffect(() => {
    if (!productApi) return;
    setProductSnapCount(productApi.scrollSnapList().length);
    setCurrentProductIndex(productApi.selectedScrollSnap());
    productApi.on("select", () => {
      setCurrentProductIndex(productApi.selectedScrollSnap());
    });
    productApi.on("reInit", () => {
      setProductSnapCount(productApi.scrollSnapList().length);
      setCurrentProductIndex(productApi.selectedScrollSnap());
    });
  }, [productApi]);

  useEffect(() => {
    if (!projectApi) return;
    setCurrentProject(projectApi.selectedScrollSnap());
    projectApi.on("select", () => {
      setCurrentProject(projectApi.selectedScrollSnap());
    });
  }, [projectApi]);

  useEffect(() => {
    if (!testimonialApi) return;
    setTestimonialCount(testimonialApi.scrollSnapList().length);
    setCurrentTestimonial(testimonialApi.selectedScrollSnap());
    testimonialApi.on("select", () => {
      setCurrentTestimonial(testimonialApi.selectedScrollSnap());
    });
  }, [testimonialApi]);

  const handleShare = async (product: any) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const shareData = {
      title: product.title,
      text: product.description || 'Check out this amazing product on Oflex Creative Studio!',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied!',
          description: 'Product link copied to clipboard.',
        });
      } catch (err) {
        console.error('Error copying link:', err);
      }
    }
  };

  // Fetch site stats
  const { data: siteStats } = useQuery({
    queryKey: ['site-stats'],
    queryFn: async () => {
      const [{ count: productsCount }, { count: usersCount }, { count: projectsCount }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('featured_projects').select('*', { count: 'exact', head: true }),
      ]);
      return {
        productCount: productsCount || 0,
        userCount: usersCount || 0,
        projectCount: projectsCount || 0,
      } as SiteStats;
    },
  });

  // Fetch featured projects using centralized hook
  const { data: featuredProjects = [] } = useProjects({ isFeatured: true });

  // Fetch featured products using centralized hook (limit to 16 for rich carousel)
  const { data: featuredProducts = [], isLoading: productsLoading } = useProducts({ isActive: true, limit: 16 });

  const [wishlist, setWishlist] = useState<string[]>([]);
  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      const exists = prev.includes(id);
      if (exists) {
        toast({ title: 'Removed from wishlist' });
        return prev.filter(item => item !== id);
      } else {
        toast({ title: 'Added to wishlist!' });
        return [...prev, id];
      }
    });
  };

  // Fetch testimonials using centralized hook
  const { data: testimonials = [] } = useTestimonials();

  // Fetch services from Supabase
  const { data: allServices = [] } = useServices();
  const dynamicServices = allServices.filter(s => s.is_active).slice(0, 3);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Please login to add items to cart');

      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: (existingItem.quantity || 0) + 1 })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: 1
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Added to cart!' });
    },
    onError: (error: Error) => {
      toast({
        title: error.message === 'Please login to add items to cart' ? 'Please login' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  return (
    <Layout>
      {/* Hero Section - V2 Modern Split Design */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20 pb-16">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          {/* Permanent dark base layer */}
          <div className="absolute inset-0 bg-[#1a1a2e]" />
          {getSetting('hero_background_url') && (
            <motion.div
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {(getSetting('hero_background_url', '').toLowerCase().match(/\.(mp4|webm|ogg|mov|m4v|mkv)$/) || getSetting('hero_background_url', '').includes('video')) ? (
                <video
                  src={getSetting('hero_background_url', '')}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <img
                  src={getOptimizedImageUrl(getSetting('hero_background_url', ''), 1600)}
                  alt="Hero background"
                  loading="eager"
                  decoding="sync"
                  {...({ fetchpriority: "high" } as any)}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )}
            </motion.div>
          )}
          <div 
            className="absolute inset-0 z-10" 
            style={{
              backgroundImage: `linear-gradient(to right, 
                rgba(26, 26, 46, 1) 0%, 
                rgba(26, 26, 46, ${getSetting('hero_gradient_opacity', '0.9')}) ${getSetting('hero_gradient_position', '50')}%, 
                transparent 100%)`
            }}
          />
          <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-primary/5 to-transparent opacity-100" />
        </div>

        <div className="container mx-auto px-4 relative z-10 h-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Content */}
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 pt-8 lg:pt-0">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-normal capitalize text-white leading-[1.2] lg:leading-[1.1] mb-6"
              >
                Digital Solutions<br />
                Engineered To Boost<br />
                <span className="text-primary font-extrabold">Your Growth!</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl md:text-2xl text-white/90 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left px-4 sm:px-0"
              >
                Oflex Creative specializes in end-to-end web and mobile development, intuitive UI/UX design, and custom software solutions engineered for growth.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center lg:items-start"
              >
                <Button className="w-56 sm:w-auto h-12 sm:h-14 px-10 rounded-none bg-primary hover:bg-primary/90 text-white font-bold text-base border-none shadow-sm transition-all" asChild>
                  <Link to="/portfolio">
                    {getSetting('hero_button1_text', 'View Portfolio')}
                  </Link>
                </Button>
                <Button className="w-56 sm:w-auto h-12 sm:h-14 px-10 rounded-none bg-white hover:bg-white/90 text-[#1A1028] font-bold text-base border-none shadow-sm transition-all" asChild>
                  <Link to="/store">
                    {getSetting('hero_button2_text', 'Visit Store')}
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Right Column: Visual Composition */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block h-full min-h-[500px]"
            >
              {/* Abstract decorative shapes */}
              <div className="absolute top-10 right-10 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
              <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />

              {/* Floating Cards Composition */}
              <div className="relative z-10 w-full h-full flex flex-col justify-center items-center">
                {siteStats && (
                  <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                    {/* Main Large Card */}
                    <div className="col-span-2">
                      <GlassCard className="p-6 border-white/20 backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <motion.div
                              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute inset-0 bg-primary/40 rounded-full blur-xl"
                            />
                            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg">
                              <Package className="w-6 h-6" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold text-white">{siteStats.productCount}+</h3>
                            <p className="text-sm text-white/80">{getSetting('hero_stat1_label', 'Digital Products Available')}</p>
                          </div>
                        </div>
                        <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-primary rounded-full animate-pulse" />
                        </div>
                      </GlassCard>
                    </div>

                    {/* Secondary Cards */}
                    <GlassCard className="p-5 border-white/20 backdrop-blur-md transform hover:-translate-y-1 transition-transform" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute inset-0 bg-white/30 rounded-full blur-lg"
                          />
                          <div className="relative w-10 h-10 rounded-lg bg-chart-2/20 text-white flex items-center justify-center">
                            <Users className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{siteStats.userCount}+</p>
                          <p className="text-xs text-white/80">{getSetting('hero_stat2_label', 'Happy Clients')}</p>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard className="p-5 border-white/20 backdrop-blur-md transform hover:-translate-y-1 transition-transform" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute inset-0 bg-white/30 rounded-full blur-lg"
                          />
                          <div className="relative w-10 h-10 rounded-lg bg-chart-3/20 text-white flex items-center justify-center">
                            <Briefcase className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{siteStats.projectCount}+</p>
                          <p className="text-xs text-white/80">{getSetting('hero_stat3_label', 'Completed Projects')}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mobile Stats (Only visible on small screens) */}
            <div className="lg:hidden w-full pb-8">
              {siteStats && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 text-center">
                    <p className="text-xl font-bold text-primary">{siteStats.productCount}+</p>
                    <p className="text-[10px] text-white/80">Products</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 text-center">
                    <p className="text-xl font-bold text-white">{siteStats.userCount}+</p>
                    <p className="text-[10px] text-white/80">Clients</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 text-center">
                    <p className="text-xl font-bold text-white">{siteStats.projectCount}+</p>
                    <p className="text-[10px] text-white/80">Projects</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Clean divider line between hero and next section */}
      <div className="w-full h-px bg-border" />

      {/* Services Preview - Modern Enhanced Layout */}
      <section className="py-16 sm:py-20 relative overflow-hidden bg-slate-50/70 dark:bg-background border-t border-slate-200/60 dark:border-white/5">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight font-lato text-left">
                  {getSetting('home_services_title', 'Our Services')}
                </h2>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF5500]/15 text-[#FF5500]">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-sm sm:text-base text-left">
                {getSetting('home_services_description', 'Comprehensive creative solutions tailored to your needs')}
              </p>
            </div>

            <Link
              to="/services"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-[#FF5500] dark:hover:text-[#FF5500] transition-colors group shrink-0"
            >
              <span className="underline underline-offset-4">Explore all services</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: 'Code', title: 'Development', description: 'Full-Stack Engineering for Web & Mobile. We build robust websites, scalable web apps, custom software, and native mobile applications tailored to your business logic.' },
              { icon: 'Palette', title: 'Graphic Design', description: 'Strategic UI/UX & Visual Identity. We design intuitive user interfaces and striking brand visuals that bridge the gap between aesthetic beauty and functional performance.' },
              { icon: 'Camera', title: 'Photography', description: 'Professional Visual Storytelling. High-quality commercial and product photography designed to elevate your brand’s aesthetic and showcase your work with professional clarity.' },
            ].map((service, index) => {
              const IconComponent = typeof service.icon === 'string' ? (iconMap[service.icon] || Sparkles) : service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                  className="h-full"
                >
                  <div className="bg-white dark:bg-[#1A1028] rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-xl hover:border-[#FF5500]/40 transition-all duration-300 h-full group">
                    <div className="mb-6 flex items-center justify-center">
                      <IconComponent className="w-12 h-12 sm:w-14 sm:h-14 text-[#FF5500] stroke-[2.75] transition-transform duration-300 group-hover:scale-110" strokeWidth={2.75} />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 font-lato">
                      {service.title}
                    </h3>

                    <p className="text-[14px] leading-relaxed text-slate-600 dark:text-muted-foreground mb-8 flex-grow">
                      {service.description}
                    </p>

                    <div className="mt-auto w-full">
                      <Button
                        className="bg-[#FF5500] hover:bg-[#E04B00] text-white w-full py-5 rounded-none font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm"
                        asChild
                      >
                        <Link to="/services">
                          Learn More
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Horizontal Swipe Carousel */}
      <section className="pt-14 pb-4 sm:pt-16 sm:pb-6 bg-card/50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight font-lato text-left">
                  {getSetting('home_store_title', 'Canva Templates')}
                </h2>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF5500]/15 text-[#FF5500]">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-sm sm:text-base text-left">
                {getSetting('home_store_description', 'Premium editable Canva templates for your creative projects')}
              </p>
            </div>

            <Link
              to="/store"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-[#FF5500] dark:hover:text-[#FF5500] transition-colors group shrink-0"
            >
              <span className="underline underline-offset-4">Explore all templates</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-card border border-slate-200 dark:border-border/80 rounded-none p-3 sm:p-4 animate-pulse flex flex-col h-full">
                  <div className="aspect-square rounded-none bg-slate-100 dark:bg-muted mb-3 sm:mb-4" />
                  <div className="h-5 bg-slate-100 dark:bg-muted rounded-none w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 dark:bg-muted rounded-none w-1/2 mb-3" />
                  <div className="border-t border-slate-100 dark:border-border/60 my-2" />
                  <div className="flex justify-between items-center mt-auto pt-1">
                    <div className="h-6 bg-slate-100 dark:bg-muted rounded-none w-16" />
                    <div className="flex gap-2">
                      <div className="w-9 h-9 rounded-none bg-slate-100 dark:bg-muted" />
                      <div className="w-9 h-9 rounded-none bg-slate-100 dark:bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="relative">
              <Carousel
                setApi={setProductApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: true,
                    stopOnMouseEnter: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-3 sm:-ml-5">
                  {featuredProducts.map((product, index) => (
                    <CarouselItem
                      key={product.id}
                      className="pl-3 sm:pl-5 basis-1/2 md:basis-1/3 lg:basis-1/4"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className="bg-transparent dark:bg-transparent rounded-none p-0 overflow-hidden group h-full flex flex-col cursor-pointer transition-all duration-300"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {/* Image Container with Rating overlay */}
                        <div className="aspect-square relative overflow-hidden rounded-none bg-slate-100 dark:bg-white/5 mb-3 sm:mb-4">

                          {/* Rating Pill in Bottom Left */}
                          <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-white z-10 border border-slate-100 dark:border-white/10">
                            <span>4.9</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-slate-400 dark:text-slate-400 font-normal text-[10px]">(15)</span>
                          </div>

                          <OptimizedImage
                            src={product.image_url || ''}
                            alt={product.title}
                            width={500}
                            priority={index < 4}
                            className="w-full h-full"
                            imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Share button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleShare(product);
                            }}
                            className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-none bg-white/90 dark:bg-card/90 text-slate-700 dark:text-slate-200 shadow-md hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10"
                            title="Share product"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col flex-grow">
                          {/* Product Title */}
                          <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#FF5500] transition-colors mb-1.5 text-left">
                            {product.title}
                          </h3>

                          {/* Sold by: Oflex */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-muted-foreground font-medium mb-2 text-left">
                            <span className="text-slate-400">Sold by:</span>
                            <span className="font-bold text-[#FF5500] flex items-center gap-1">
                              Oflex
                              <CheckCircle2 className="w-3.5 h-3.5 fill-[#FF5500] text-white" />
                            </span>
                          </div>

                          {/* Canva Template Badges */}
                          <div className="space-y-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-muted-foreground mb-3 text-left">
                            <div className="flex items-center gap-1.5 truncate">
                              <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Easy to Customize in Canva</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <BadgeCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Instant Access & Fully Editable</span>
                            </div>
                          </div>

                          {/* Bottom Price or Hover Action Buttons */}
                          <div className="pt-2.5 border-t border-slate-200/70 dark:border-white/10 mt-auto min-h-[44px] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                            {/* Default Price View */}
                            <div className="flex items-baseline gap-2 group-hover:hidden transition-all duration-200">
                              <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white font-lato">
                                {currencySymbol}{product.price.toFixed(2)}
                              </span>
                              <span className="text-[11px] sm:text-xs text-slate-400 line-through">
                                {currencySymbol}{(product.price * 1.3).toFixed(2)}
                              </span>
                            </div>

                            {/* Hover Action Buttons (shown on card hover) */}
                            <div className="hidden group-hover:flex items-center gap-2 transition-all duration-200 w-full">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/product/${product.id}`);
                                }}
                                className="px-3 sm:px-3.5 py-1.5 rounded-full border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow-2xs"
                              >
                                Learn More
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  addToCartMutation.mutate(product.id);
                                }}
                                className="px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-950 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                              >
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Bottom Pagination & Navigation Controls Matching Image 2 */}
              {productSnapCount > 1 && (
                <div className="flex items-center justify-center gap-4 mt-5">
                  <button
                    onClick={() => productApi?.scrollPrev()}
                    aria-label="Previous products"
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 hover:border-[#FF5500] text-slate-600 dark:text-white/80 hover:text-[#FF5500] flex items-center justify-center transition-all active:scale-95 bg-white dark:bg-card shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: productSnapCount }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => productApi?.scrollTo(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          currentProductIndex === i
                            ? 'bg-[#FF5500] w-6'
                            : 'bg-slate-200 dark:bg-white/20 w-2 hover:bg-slate-300 dark:hover:bg-white/40'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => productApi?.scrollNext()}
                    aria-label="Next products"
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 hover:border-[#FF5500] text-slate-600 dark:text-white/80 hover:text-[#FF5500] flex items-center justify-center transition-all active:scale-95 bg-white dark:bg-card shadow-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Hero Banner Slider - Full Flush */}
      <section className="w-full py-0 my-0">
        <HeroBannerSlider />
      </section>

      {/* Featured Works - Modern Agency Showcase Grid */}
      <section className="py-16 sm:py-20 relative overflow-hidden bg-slate-50/70 dark:bg-background border-t border-slate-200/60 dark:border-white/5">
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header - Left Aligned with Explore Link on Right */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B2545] dark:text-white tracking-tight font-lato text-left">
                Latest Projects
              </h2>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base text-left">
                Explore our hand-crafted digital systems, web applications, and creative brand solutions.
              </p>
            </div>

            <Link
              to="/portfolio"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B2545] dark:text-slate-200 hover:text-[#FF5500] dark:hover:text-[#FF5500] transition-colors group shrink-0"
            >
              <span className="underline underline-offset-4">Explore all projects</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredProjects.map((project, index) => {
              const projectUrl = project.project_url || null;
              const hasExternalLink = Boolean(projectUrl);

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xs hover:shadow-2xl hover:border-[#FF5500]/40 transition-all duration-500 group h-full cursor-pointer"
                  onClick={() => {
                    if (projectUrl) {
                      window.open(projectUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate('/portfolio');
                    }
                  }}
                >
                  {/* Browser-style Preview Window */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                    {project.image_url ? (
                      <OptimizedImage
                        src={project.image_url}
                        alt={project.title}
                        width={650}
                        className="w-full h-full"
                        imageClassName="object-cover w-full h-full transform transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-[#1A1028] flex items-center justify-center p-6 text-center">
                        <span className="text-xl font-black text-white uppercase tracking-wider">{project.title}</span>
                      </div>
                    )}

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Floating Category / Tag Pill */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/75 dark:bg-black/85 backdrop-blur-md text-white text-[11px] font-bold tracking-wide uppercase shadow-sm border border-white/15">
                        {project.category || 'Live Project'}
                      </span>
                    </div>

                    {/* Floating External Preview Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-9 h-9 rounded-full bg-white/95 dark:bg-[#1A1028]/95 backdrop-blur-md text-slate-800 dark:text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 border border-slate-200/60 dark:border-white/15">
                        <ArrowUpRight className="w-4 h-4 text-[#FF5500] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-7 flex flex-col flex-grow">
                    {/* Project Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-[#FF5500] transition-colors mb-2.5 text-left line-clamp-1">
                      {project.title}
                    </h3>

                    {/* Project Description */}
                    <p className="text-slate-600 dark:text-muted-foreground text-[13px] sm:text-sm leading-relaxed line-clamp-2 text-left mb-6 flex-grow">
                      {project.description || "An innovative digital solution engineered to empower operations with seamless performance and modern design."}
                    </p>

                    {/* Bottom Action Row */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between mt-auto">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF5500]">
                        <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
                        Live Platform
                      </span>

                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#FF5500] transition-colors">
                        <span>{hasExternalLink ? 'View Project' : 'Learn More'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Explore Full Portfolio Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center mt-12 sm:mt-16"
          >
            <Button
              className="h-12 sm:h-13 px-8 rounded-full bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white hover:border-[#FF5500] hover:text-[#FF5500] dark:hover:text-[#FF5500] font-bold text-sm shadow-sm hover:shadow-md transition-all group active:scale-95"
              asChild
            >
              <Link to="/portfolio">
                Explore Full Portfolio
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Custom Customer Reviews Section */}
      <section className="pt-10 pb-12 sm:pt-14 sm:pb-14 bg-white dark:bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1A1028] dark:text-white mb-2.5 font-roboto">
              Customer Reviews
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-[15px] leading-relaxed">
              Explore the unfiltered voices of our satisfied customers and discover why they choose Oflex Creative.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto px-4 md:px-12">
            <Carousel
              setApi={setTestimonialApi}
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 5000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-6">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={testimonial.id || index} className="pl-6 md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="relative h-full flex flex-col pb-2"
                    >
                      <div className="bg-white dark:bg-card border border-border shadow-[0_10px_40px_-5px_rgba(0,0,0,0.03)] rounded-2xl p-6 sm:p-7 flex flex-col items-center group transition-all duration-300 relative z-10">
                        <Quote className="w-9 h-9 sm:w-12 sm:h-12 text-primary/10 mb-3 sm:mb-4 flex-shrink-0" />

                        <div className="flex-grow text-center min-h-[90px] flex items-center justify-center">
                          <p className="text-muted-foreground text-sm sm:text-[14px] leading-relaxed mb-4 px-2">
                            "{testimonial.content}"
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 mb-2 mt-auto">
                          {[...Array(testimonial.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[#FFB81C] text-[#FFB81C] drop-shadow-sm" />
                          ))}
                        </div>

                        {/* Overlapping Avatar */}
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-20">
                          <div className="w-14 h-14 rounded-full p-1 bg-white dark:bg-card shadow-md">
                            <Avatar className="w-full h-full border-none">
                              <AvatarImage src={getOptimizedImageUrl(testimonial.avatar_url || '', 150)} alt={testimonial.name} className="object-cover rounded-full" />
                              <AvatarFallback className="bg-primary/5 text-primary text-base font-bold">
                                {getInitials(testimonial.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>

                      {/* Info below card and avatar */}
                      <div className="mt-9 mb-1 text-center">
                        <h4 className="font-bold text-[#1A1028] dark:text-white text-base">
                          {testimonial.name}
                        </h4>
                        <p className="text-muted-foreground text-[10px] sm:text-[11px] font-medium uppercase tracking-wider mt-0.5">
                          {testimonial.role}
                        </p>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Enhanced dynamic indicators */}
              <div className="flex justify-center gap-2 mt-2 sm:mt-3">
                {Array.from({ length: testimonialCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => testimonialApi?.scrollTo(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${currentTestimonial === i
                      ? 'bg-primary w-6'
                      : 'bg-slate-200 w-2.5 hover:bg-slate-300'
                      }`}
                  />
                ))}
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Trusted By 100+ Clients Worldwide Section (Matching Image 1) */}
      <TrustedBySection />


    </Layout>
  );
};

export default Index;
