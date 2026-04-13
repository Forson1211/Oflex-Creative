import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Palette, Code, Zap, Layers, Wand2, Star, ShoppingBag, ShoppingCart, Users, Package, Briefcase, Share2, ChevronRight, Camera, Smartphone, Quote } from 'lucide-react';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getSetting } = useSiteSettings();
  const [projectApi, setProjectApi] = useState<CarouselApi>();
  const [currentProject, setCurrentProject] = useState(0);
  const [testimonialApi, setTestimonialApi] = useState<CarouselApi>();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [testimonialCount, setTestimonialCount] = useState(0);

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

  // Fetch featured products using centralized hook
  const { data: allProducts = [] } = useProducts({ isActive: true });
  const featuredProducts = allProducts.slice(0, 8);

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
          <motion.img
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.9 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            src={getOptimizedImageUrl(getSetting('hero_background_url', ''), 1600)}
            alt="Hero background"
            loading="eager"
            decoding="sync"
            {...({ fetchpriority: "high" } as any)}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ display: getSetting('hero_background_url') ? 'block' : 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/80 lg:to-background/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-primary/5 to-transparent opacity-100" />
        </div>

        <div className="container mx-auto px-4 relative z-10 h-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Content */}
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 pt-8 lg:pt-0">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-normal capitalize text-black dark:text-white leading-[1.2] lg:leading-[1.1] mb-6"
              >
                Digital Solutions<br />
                Engineered To Boost<br />
                <span className="text-primary font-extrabold">Your Growth!</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl md:text-2xl text-black dark:text-white mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left px-4 sm:px-0"
              >
                Oflex Creative specializes in end-to-end web and mobile development, intuitive UI/UX design, and custom software solutions engineered for growth.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center lg:items-start"
              >
                <Button className="w-56 sm:w-auto h-12 sm:h-14 px-10 rounded-none bg-[#FF6B35] hover:bg-[#e85a25] text-white font-bold text-base border-none shadow-sm transition-all" asChild>
                  <Link to="/portfolio">
                    {getSetting('hero_button1_text', 'View Portfolio')}
                  </Link>
                </Button>
                <Button className="w-56 sm:w-auto h-12 sm:h-14 px-10 rounded-none bg-[#1A1028] hover:bg-[#251838] dark:bg-white dark:hover:bg-white/90 text-white dark:text-black font-bold text-base border-none shadow-sm transition-all" asChild>
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
                      <GlassCard className="p-6 border-white/20 bg-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground shadow-lg">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold text-black dark:text-white">{siteStats.productCount}+</h3>
                            <p className="text-sm text-black dark:text-white/80">{getSetting('hero_stat1_label', 'Digital Products Available')}</p>
                          </div>
                        </div>
                        <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-primary rounded-full animate-pulse" />
                        </div>
                      </GlassCard>
                    </div>

                    {/* Secondary Cards */}
                    <GlassCard className="p-5 border-white/20 bg-white/5 backdrop-blur-md transform hover:-translate-y-1 transition-transform">
                      <div className="flex flex-col gap-3">
                        <div className="w-10 h-10 rounded-lg bg-chart-2/20 text-chart-2 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-black dark:text-white">{siteStats.userCount}+</p>
                          <p className="text-xs text-black dark:text-white/80">{getSetting('hero_stat2_label', 'Happy Clients')}</p>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard className="p-5 border-white/20 bg-white/5 backdrop-blur-md transform hover:-translate-y-1 transition-transform">
                      <div className="flex flex-col gap-3">
                        <div className="w-10 h-10 rounded-lg bg-chart-3/20 text-chart-3 flex items-center justify-center">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-black dark:text-white">{siteStats.projectCount}+</p>
                          <p className="text-xs text-black dark:text-white/80">{getSetting('hero_stat3_label', 'Completed Projects')}</p>
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
                  <div className="bg-card/50 p-3 rounded-xl border text-center">
                    <p className="text-xl font-bold text-primary">{siteStats.productCount}+</p>
                    <p className="text-[10px] text-black dark:text-white/80">Products</p>
                  </div>
                  <div className="bg-card/50 p-3 rounded-xl border text-center">
                    <p className="text-xl font-bold text-black dark:text-white">{siteStats.userCount}+</p>
                    <p className="text-[10px] text-black dark:text-white/80">Clients</p>
                  </div>
                  <div className="bg-card/50 p-3 rounded-xl border text-center">
                    <p className="text-xl font-bold text-black dark:text-white">{siteStats.projectCount}+</p>
                    <p className="text-[10px] text-black dark:text-white/80">Projects</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <SectionHeading
            title={getSetting('home_store_title', 'Featured Products')}
            description={getSetting('home_store_description', 'Premium digital assets for your creative projects')}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mt-12">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white dark:bg-card border border-border/40 rounded-[20px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden group h-full flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-50">
                  <OptimizedImage
                    src={product.image_url || ''}
                    alt={product.title}
                    width={500}
                    className="w-full h-full"
                    imageClassName="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Subtle Share Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleShare(product);
                    }}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-[#1A1028] border border-white/20 hover:bg-white transition-all transform opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0"
                  >
                    <Share2 className="w-3 link:h-3" />
                  </button>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#FF6B35] font-roboto font-bold mb-1">
                      {product.category}
                    </p>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-bold text-[#1A1028] dark:text-white text-[17px] leading-tight hover:text-[#FF6B35] transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between mt-2 mb-3">
                    <span className="text-[#FF6B35] font-extrabold text-lg sm:text-2xl">${product.price}</span>
                    <div className="hidden xs:block px-2 py-0.5 rounded-none bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                      <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Digital</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCartMutation.mutate(product.id);
                      }}
                      className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white rounded-sm font-bold text-[10px] sm:text-xs py-3 sm:py-5 transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {featuredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available yet.</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button variant="ghost" className="rounded-none px-10 h-14 bg-white dark:bg-white border border-border/50 shadow-md hover:shadow-lg hover:bg-white/90 dark:hover:bg-white/90 transition-all group font-bold text-[#1A1028] dark:text-black" asChild>
              <Link to="/store">
                <ShoppingBag className="mr-2 w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                View All Products
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Hero Banner Slider - With proper spacing */}
      <section className="py-8 md:py-12">
        <HeroBannerSlider />
      </section>

      {/* Services Preview - Modern Enhanced Layout */}
      <section className="py-24 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-background/50" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <SectionHeading
            title={getSetting('home_services_title', 'Our Services')}
            description={getSetting('home_services_description', 'Comprehensive creative solutions tailored to your needs')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[
              { icon: 'Code', title: 'Development', description: 'Full-Stack Engineering for Web & Mobile. We build robust websites, scalable web apps, custom software, and native mobile applications tailored to your business logic.' },
              { icon: 'Palette', title: 'Graphic Design', description: 'Strategic UI/UX & Visual Identity. We design intuitive user interfaces and striking brand visuals that bridge the gap between aesthetic beauty and functional performance.' },
              { icon: 'Camera', title: 'Photography', description: 'Professional Visual Storytelling. High-quality commercial and product photography designed to elevate your brand’s aesthetic and showcase your work with professional clarity.' },
            ].map((service, index) => {
              const IconComponent = typeof service.icon === 'string' ? (iconMap[service.icon] || Sparkles) : service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.21, 0.47, 0.32, 0.98]
                  }}
                  className="h-full"
                >
                  <div className="bg-white dark:bg-card rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-border/40 h-full group hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="mb-8">
                      <IconComponent className="w-16 h-16 text-[#FF6B35] transition-transform duration-500 group-hover:scale-110" />
                    </div>

                    <h3 className="text-2xl font-bold text-[#1A1028] dark:text-white mb-4 font-roboto">
                      {service.title}
                    </h3>

                    <p className="text-[15px] leading-relaxed text-muted-foreground mb-10 flex-grow">
                      {service.description}
                    </p>

                    <div className="mt-auto">
                      <Button
                        className="bg-[#FF6B35] hover:bg-[#E85D2A] text-white px-10 py-6 rounded-sm font-bold text-base transition-all duration-300 shadow-sm"
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

      {/* Featured Works - Our Softwares Grid Layout */}
      <section className="py-24 relative overflow-hidden bg-slate-50 dark:bg-background border-t border-border/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1028] dark:text-white mb-3 font-roboto uppercase tracking-tighter">
              Our Projects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-card border border-border/40 rounded-none p-10 flex flex-col items-center shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.08)] transition-all duration-500 h-full group"
              >
                {/* Logo Area - High visibility for logos - REMOVED GRAYSCALE */}
                <div className="h-24 w-full mb-8 relative flex items-center justify-center transition-all duration-500 transform group-hover:scale-105">
                  {project.image_url ? (
                    <OptimizedImage
                      src={project.image_url}
                      alt={project.title}
                      width={400}
                      className="w-full h-full"
                      imageClassName="object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <h3 className="text-3xl font-bold text-[#1A1028] dark:text-white">{project.title}</h3>
                    </div>
                  )}
                </div>

                <div className="text-center flex-grow">
                  <p className="text-[15px] leading-relaxed text-muted-foreground mb-10">
                    <span className="font-bold text-[#FF6B35]">{project.title}</span> {project.description || "is an innovative software solution designed to empower digital operations for modern businesses."}
                  </p>
                </div>

                <div className="mt-auto w-full flex justify-center">
                  <Button
                    className="bg-[#FF6B35] hover:bg-[#E85D2A] text-white px-10 py-6 rounded-sm font-bold text-base transition-all duration-300 shadow-sm"
                    asChild
                  >
                    {project.project_url ? (
                      <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                        View Project
                      </a>
                    ) : (
                      <Link to="/portfolio">
                        Learn more
                      </Link>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <Button variant="ghost" className="rounded-none px-10 h-14 bg-white dark:bg-white border border-border/50 shadow-md hover:shadow-lg hover:bg-white/90 dark:hover:bg-white/90 transition-all group font-bold text-[#1A1028] dark:text-black" asChild>
              <Link to="/portfolio">
                Explore Full Portfolio
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Custom Customer Reviews Section */}
      <section className="py-24 bg-white dark:bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1028] dark:text-white mb-4 font-roboto">
              Customer Reviews
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-[15px] leading-relaxed">
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
                      className="relative pb-20 h-full"
                    >
                      <div className="bg-white dark:bg-card border border-border shadow-[0_10px_40px_-5px_rgba(0,0,0,0.03)] rounded-2xl p-8 md:p-10 flex flex-col items-center group transition-all duration-300 relative z-10">
                        <Quote className="w-12 h-12 md:w-16 md:h-16 text-primary/10 mb-6 flex-shrink-0" />

                        <div className="flex-grow text-center min-h-[120px] flex items-center justify-center">
                          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 px-2">
                            "{testimonial.content}"
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 mb-2 mt-auto">
                          {[...Array(testimonial.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#FFB81C] text-[#FFB81C] drop-shadow-sm" />
                          ))}
                        </div>

                        {/* Overlapping Avatar */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
                          <div className="w-20 h-20 rounded-full p-1 bg-white dark:bg-card shadow-lg">
                            <Avatar className="w-full h-full border-none">
                              <AvatarImage src={getOptimizedImageUrl(testimonial.avatar_url || '', 150)} alt={testimonial.name} className="object-cover rounded-full" />
                              <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                                {getInitials(testimonial.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>

                      {/* Info below card and avatar */}
                      <div className="mt-14 mb-4 text-center">
                        <h4 className="font-bold text-[#1A1028] dark:text-white text-lg">
                          {testimonial.name}
                        </h4>
                        <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider mt-1">
                          {testimonial.role}
                        </p>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Enhanced dynamic indicators - matching target image */}
              <div className="flex justify-center gap-3 mt-4">
                {Array.from({ length: testimonialCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => testimonialApi?.scrollTo(i)}
                    className={`h-3 rounded-full transition-all duration-300 ${currentTestimonial === i
                      ? 'bg-[#FF6B35] w-6'
                      : 'bg-slate-200 w-3 hover:bg-slate-300'
                      }`}
                  />
                ))}
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* CTA Section - Modern Glassmorphic Design */}
      <section className="py-24 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <GlassCard className="max-w-6xl mx-auto rounded-3xl overflow-hidden border-primary/20 p-0 relative group">
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40 z-0" />

              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center p-8 md:p-16">
                {/* Text Content */}
                <div className="text-left space-y-6">
                  <Badge variant="outline" className="px-4 py-1.5 border-primary/50 text-primary bg-primary/10 text-sm">
                    {getSetting('home_cta_badge', "🚀 Let's Build Something Amazing")}
                  </Badge>

                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                    <span className="text-primary">
                      {getSetting('home_cta_title', 'Ready to elevate your brand?')}
                    </span>
                  </h2>

                  <p className="text-lg md:text-xl text-muted-foreground/90 max-w-xl leading-relaxed">
                    {getSetting('home_cta_description', "Join hundreds of satisfied clients who have transformed their digital presence. From concept to launch, we're your partners in creative excellence.")}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button size="lg" className="h-14 px-8 rounded-none text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300" asChild>
                      <Link to="/contact">
                        Start a Project
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-none text-base bg-background/50 border-white/10 hover:bg-background/80" asChild>
                      <Link to="/portfolio">
                        View Our Work
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Visual Element (Desktop Only) */}
                <div className="relative hidden md:block h-full min-h-[400px] flex items-center justify-center">
                  {/* Floating abstract code/design interface */}
                  <div className="relative z-10 w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-3 transition-transform duration-700 ease-out group-hover:rotate-0 group-hover:scale-105">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                      </div>
                      <div className="h-2 w-20 bg-white/10 rounded-full" />
                    </div>
                    {/* Content skeleton */}
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-1/3 h-24 rounded-lg bg-primary/20 animate-pulse" />
                        <div className="w-2/3 space-y-3">
                          <div className="h-4 w-full bg-white/10 rounded-md" />
                          <div className="h-4 w-3/4 bg-white/10 rounded-md" />
                          <div className="h-4 w-1/2 bg-white/10 rounded-md" />
                        </div>
                      </div>
                      <div className="h-32 w-full bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg border border-white/5" />
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-8 w-24 bg-primary rounded-md opacity-80" />
                        <div className="h-8 w-8 rounded-full bg-white/10" />
                      </div>
                    </div>
                  </div>

                  {/* Floating Icons */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-10 bg-background/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-primary/20"
                  >
                    <Sparkles className="w-8 h-8 text-yellow-500" />
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 -left-4 bg-background/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-primary/20"
                  >
                    <Zap className="w-8 h-8 text-primary" />
                  </motion.div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
