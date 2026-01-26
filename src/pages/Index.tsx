import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Palette, Code, Zap, Star, ShoppingBag, ShoppingCart, Users, Package, Briefcase } from 'lucide-react';
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



interface SiteStats {
  productCount: number;
  userCount: number;
  projectCount: number;
}

const services = [
  { icon: Sparkles, title: 'Prompt Engineering', description: 'AI-powered creative prompts' },
  { icon: Palette, title: 'Brand Design', description: 'Visual identity systems' },
  { icon: Code, title: 'UI/UX Design', description: 'User-centered interfaces' },
  { icon: Zap, title: 'AI Automation', description: 'Workflow optimization' },
];

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
  const featuredProducts = allProducts.slice(0, 4);

  // Fetch testimonials using centralized hook
  const { data: testimonials = [] } = useTestimonials();

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
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getSetting('hero_background_url', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&h=1080&fit=crop')})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20" />
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
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6"
              >
                {getSetting('hero_title', 'Crafting Digital')}
                <br />
                <span className="text-primary font-extrabold">
                  {getSetting('hero_subtitle', 'Experiences')}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed text-center px-4 sm:px-0"
              >
                {getSetting('hero_description', 'From AI prompts to stunning designs, we bring your creative visions to life. Explore our portfolio and discover premium digital products.')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center lg:items-start"
              >
                <Button size="lg" className="w-56 sm:w-auto h-11 sm:h-14 px-5 sm:px-8 rounded-full text-sm sm:text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
                  <Link to="/portfolio">
                    {getSetting('hero_button1_text', 'View Portfolio')}
                    <ArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-56 sm:w-auto h-11 sm:h-14 px-5 sm:px-8 rounded-full text-sm sm:text-base backdrop-blur-sm bg-background/50 hover:bg-background/80" asChild>
                  <Link to="/store">
                    <ShoppingBag className="mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                            <h3 className="text-3xl font-bold text-foreground">{siteStats.productCount}+</h3>
                            <p className="text-sm text-muted-foreground">{getSetting('hero_stat1_label', 'Digital Products Available')}</p>
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
                          <p className="text-2xl font-bold">{siteStats.userCount}+</p>
                          <p className="text-xs text-muted-foreground">{getSetting('hero_stat2_label', 'Happy Clients')}</p>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard className="p-5 border-white/20 bg-white/5 backdrop-blur-md transform hover:-translate-y-1 transition-transform">
                      <div className="flex flex-col gap-3">
                        <div className="w-10 h-10 rounded-lg bg-chart-3/20 text-chart-3 flex items-center justify-center">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{siteStats.projectCount}+</p>
                          <p className="text-xs text-muted-foreground">{getSetting('hero_stat3_label', 'Completed Projects')}</p>
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
                    <p className="text-[10px] text-muted-foreground">Products</p>
                  </div>
                  <div className="bg-card/50 p-3 rounded-xl border text-center">
                    <p className="text-xl font-bold text-foreground">{siteStats.userCount}+</p>
                    <p className="text-[10px] text-muted-foreground">Clients</p>
                  </div>
                  <div className="bg-card/50 p-3 rounded-xl border text-center">
                    <p className="text-xl font-bold text-foreground">{siteStats.projectCount}+</p>
                    <p className="text-[10px] text-muted-foreground">Projects</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Hero Banner Slider - With proper spacing */}
      <section className="py-8 md:py-12">
        <HeroBannerSlider />
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge={getSetting('home_services_badge', 'What We Do')}
            title={getSetting('home_services_title', 'Our Services')}
            description={getSetting('home_services_description', 'Comprehensive creative solutions tailored to your needs')}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="text-center h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <service.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Works - Larger on desktop, vertical on mobile */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge={getSetting('home_portfolio_badge', 'Our Work')}
            title={getSetting('home_portfolio_title', 'Featured Projects')}
            description={getSetting('home_portfolio_description', 'A glimpse into our creative portfolio')}
          />

          {/* Grid: 1 column on mobile (vertical), 3 columns on desktop (larger) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to="/portfolio">
                  <GlassCard className="overflow-hidden p-0 group">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <OptimizedImage
                        src={project.image_url}
                        alt={project.title}
                        width={600}
                        className="w-full h-full"
                        imageClassName="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=300&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-2">
                          {project.category}
                        </span>
                        <h3 className="text-base font-semibold text-foreground line-clamp-1">{project.title}</h3>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg" asChild>
              <Link to="/portfolio">
                View All Projects
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge={getSetting('home_store_badge', 'Digital Store')}
            title={getSetting('home_store_title', 'Featured Products')}
            description={getSetting('home_store_description', 'Premium digital assets for your creative projects')}
          />

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:pb-0 md:mx-0 md:px-0 scrollbar-none">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group min-w-[260px] md:min-w-0 snap-center"
              >
                <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                  <div className="relative aspect-square overflow-hidden">
                    <OptimizedImage
                      src={product.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=400&fit=crop'}
                      alt={product.title}
                      width={400}
                      className="w-full h-full"
                      imageClassName="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          addToCartMutation.mutate(product.id);
                        }}
                        className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </motion.button>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wider text-primary font-medium mb-2">
                      {product.category}
                    </p>
                    <h3 className="font-semibold text-foreground text-lg leading-snug line-clamp-2 mb-3 min-h-[3.5rem]">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-bold text-xl">${product.price}</p>
                      <Badge variant="secondary" className="text-xs">Digital</Badge>
                    </div>
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button size="lg" variant="outline" asChild>
              <Link to="/store">
                <ShoppingBag className="mr-2 w-4 h-4" />
                View All Products
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge={getSetting('home_testimonials_badge', 'Testimonials')}
            title={getSetting('home_testimonials_title', 'What Clients Say')}
            description={getSetting('home_testimonials_description', "Hear from those who've experienced our work")}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover={false} className="h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border border-border">
                      <AvatarImage src={testimonial.avatar_url || ''} alt={testimonial.name} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(testimonial.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
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

                  <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                    {getSetting('home_cta_description', 'Join hundreds of satisfied clients who have transformed their digital presence. From concept to launch, we are your partners in creative excellence.')}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button size="lg" className="h-14 px-8 rounded-full text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300" asChild>
                      <Link to="/contact">
                        Start a Project
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base bg-background/50 border-white/10 hover:bg-background/80" asChild>
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
