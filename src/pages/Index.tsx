import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Palette, Code, Zap, Star, ShoppingBag, ShoppingCart, Users, Package, Briefcase } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { HeroBannerSlider } from '@/components/HeroBannerSlider';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface FeaturedProject {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  is_featured: boolean;
  display_order: number;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar_url: string | null;
  rating: number;
}

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

  // Fetch featured projects
  const { data: featuredProjects = [] } = useQuery({
    queryKey: ['featured-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_projects')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(4);

      if (error) throw error;
      return data as FeaturedProject[];
    },
  });

  // Fetch featured products
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  // Fetch testimonials
  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });

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
      {/* Hero Section - Modern & Professional */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden pt-16 md:pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getSetting('hero_background_url', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&h=1080&fit=crop')})` }}
          />
          {/* Gradient overlay that shows background but ensures text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        </div>

        {/* Gradient Orbs - Subtle background effects */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px]"
        />

        {/* Main Hero Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-6 md:mb-8"
            >
              <motion.span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                whileHover={{ scale: 1.02 }}
              >
                <Sparkles className="w-4 h-4" />
                {getSetting('hero_badge', 'Welcome to Oflex Creative')}
              </motion.span>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center mb-6"
            >
              <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
                {getSetting('hero_title', 'Crafting Digital')}
                <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  {getSetting('hero_subtitle', 'Experiences')}
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-8 md:mb-10 px-4"
            >
              {getSetting('hero_description', 'From AI prompts to stunning designs, we bring your creative visions to life. Explore our portfolio and discover premium digital products.')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 md:mb-16 px-4"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" asChild className="min-w-[160px] sm:min-w-[180px] h-12 text-base">
                  <Link to="/portfolio">
                    View Portfolio
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" asChild className="min-w-[160px] sm:min-w-[180px] h-12 text-base">
                  <Link to="/store">
                    <ShoppingBag className="mr-2 w-4 h-4" />
                    Visit Store
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats Section - Clean card design */}
            {siteStats && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="w-full"
              >
                <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
                  <div className="group relative bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50 hover:border-primary/30 transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-primary/20 transition-colors">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{siteStats.productCount}+</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Products</p>
                    </div>
                  </div>

                  <div className="group relative bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50 hover:border-chart-2/30 transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-chart-2/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-chart-2/20 transition-colors">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-chart-2" />
                      </div>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{siteStats.userCount}+</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Clients</p>
                    </div>
                  </div>

                  <div className="group relative bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50 hover:border-chart-3/30 transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-chart-3/20 transition-colors">
                        <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-chart-3" />
                      </div>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{siteStats.projectCount}+</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Projects</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
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
            badge="What We Do"
            title="Our Services"
            description="Comprehensive creative solutions tailored to your needs"
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
            badge="Our Work"
            title="Featured Projects"
            description="A glimpse into our creative portfolio"
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
            badge="Digital Store"
            title="Featured Products"
            description="Premium digital assets for your creative projects"
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
            badge="Testimonials"
            title="What Clients Say"
            description="Hear from those who've experienced our work"
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
                    <OptimizedImage
                      src={testimonial.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}
                      alt={testimonial.name}
                      width={100}
                      className="w-12 h-12 rounded-full"
                      imageClassName="object-cover"
                    />
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
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-primary-foreground blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Start Your Project?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Let's collaborate and bring your creative vision to life.
              Get in touch today!
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">
                Get In Touch
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
