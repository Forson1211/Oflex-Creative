import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  ArrowRight,
  Eye,
  Plus,
  Minus,
  Trash2,
  Search,
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  Tag,
  Package,
  Palette,
  Share2,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

const Store = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthReady } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getSetting } = useSiteSettings();

  // Fetch site stats/products
  const { data: products = [], isLoading: productsLoading } = useProducts({
    isActive: true
  });

  // Fetch cart
  const { data: cartItems = [] as CartItem[] } = useQuery<CartItem[]>({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select(`*, product:products(*)`)
        .eq('user_id', user.id);
      if (error) throw error;
      return data as CartItem[];
    },
    enabled: isAuthReady && !!user,
  });

  // Dynamic Categories
  const [categories, setCategories] = useState<string[]>(['All']);
  useEffect(() => {
    if (products.length > 0) {
      const unique = [...new Set(products.map(p => p.category))].filter(Boolean);
      setCategories(['All', ...unique.sort()]);
    }
  }, [products]);

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower || p.title.toLowerCase().includes(searchLower) || (p.description?.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  // Cart Mutations
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Auth required');
      const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', productId).single();
      if (existing) {
        await supabase.from('cart_items').update({ quantity: (existing.quantity || 0) + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity: 1 });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cart'] }); toast({ title: 'Added to cart' }); },
    onError: () => toast({ title: 'Error', description: 'Please login to add items', variant: 'destructive' })
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) await supabase.from('cart_items').delete().eq('id', itemId);
      else await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await supabase.from('cart_items').delete().eq('id', itemId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => { setIsCartOpen(false); navigate('/checkout'); };

  const bannerHeightMobile = getSetting('store_banner_height_mobile', '600');
  const bannerHeightDesktop = getSetting('store_banner_height_desktop', '750');
  const bannerUrl = getSetting('store_banner_url', '/Banner.jpg');
  const posMobile = getSetting('store_banner_pos_mobile', 'object-center');
  const posDesktop = getSetting('store_banner_pos_desktop', 'object-right-top');
  const overlayOpacity = Number(getSetting('store_banner_overlay_opacity', '70')) / 100;

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-[#f8f9fa] dark:bg-background">
        {/* Custom Exact-Size Dashboard Banner Header */}
        <div className="sticky top-0 z-[49]">
          <section 
            style={{ 
              ['--mobile-height' as any]: `${bannerHeightMobile}px`,
              ['--desktop-height' as any]: `${bannerHeightDesktop}px`
            }}
            className="relative bg-[#1A1028] h-[var(--mobile-height)] md:h-[var(--desktop-height)] border-b border-white/10 overflow-hidden shadow-2xl flex items-start md:items-center pt-24 md:pt-0"
          >
            {/* Custom Banner Header Background */}
            <div className="absolute inset-0 z-0">
              <OptimizedImage
                src={bannerUrl}
                className="w-full h-full"
                imageClassName={cn("w-full h-full object-cover grayscale-0 transition-all duration-700", posMobile, `md:${posDesktop}`)}
                alt="Store Banner"
                priority
                width={1920}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent transition-opacity duration-300" 
                style={{ opacity: overlayOpacity }}
              />
            </div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-widest font-black [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                  <Link to="/" className="hover:text-[#FF6B35] transition-colors">Home</Link>
                  <span className="opacity-30">/</span>
                  <span className="text-white">Premium Templates</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                  <div className="max-w-[280px] sm:max-w-xl md:max-w-4xl mr-auto">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight [text-shadow:0_4px_25px_rgba(0,0,0,0.4)]">
                      {filteredProducts.length}+ Premium Templates for{' '}
                      <span className="text-[#FF6B35]">
                        {searchQuery || 'Creative Projects'}
                      </span>
                    </h1>
                  </div>

                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-96 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <Input
                        placeholder="Search for templates, designs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-white/20 backdrop-blur-md border border-white/30 focus-visible:ring-[#FF6B35] focus-visible:border-[#FF6B35] text-white placeholder:text-white/80 text-lg rounded-none transition-all shadow-2xl"
                      />
                    </div>

                    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                      <SheetTrigger asChild>
                        <Button className="h-14 bg-white hover:bg-slate-50 text-black border-none px-8 font-bold text-sm flex items-center gap-3 rounded-none transition-transform active:scale-95 shadow-lg group">
                          <ShoppingCart className="w-5 h-5 text-[#FF6B35]" />
                          <span className="hidden sm:inline">My Cart</span>
                          {cartCount > 0 && (
                            <span className="bg-[#FF6B35] text-white text-[10px] px-2 py-0.5 rounded-full">
                              {cartCount}
                            </span>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-md flex flex-col bg-background border-l border-border">
                        <SheetHeader className="pb-6 border-b">
                          <SheetTitle className="text-2xl font-black flex items-center gap-3">
                            <ShoppingBag className="w-7 h-7 text-[#FF6B35]" />
                            Shopping Cart
                          </SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 flex flex-col mt-6 overflow-hidden">
                          {cartItems.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                              <Package className="w-12 h-12 mb-4 opacity-20" />
                              <p>Your cart is empty</p>
                            </div>
                          ) : (
                            <div className="flex-1 overflow-auto space-y-4 pr-2">
                              {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 bg-accent/5 rounded-lg border border-border/50">
                                  <div className="w-16 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
                                    {item.product?.image_url && <img src={item.product.image_url} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="flex-1 flex flex-col justify-between">
                                    <h4 className="font-bold text-sm truncate">{item.product?.title}</h4>
                                    <p className="text-xs text-[#FF6B35] font-bold">${item.product?.price}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}><Minus className="h-3 w-3" /></Button>
                                      <span className="text-xs font-medium">{item.quantity}</span>
                                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}><Plus className="h-3 w-3" /></Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto text-muted-foreground hover:text-red-500" onClick={() => removeFromCartMutation.mutate(item.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {cartItems.length > 0 && (
                            <div className="p-6 border-t border-border mt-auto bg-card">
                              <div className="flex justify-between mb-4 font-bold text-lg"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
                              <Button className="w-full h-12 bg-[#FF6B35] hover:bg-[#E85D2A] font-bold text-white shadow-xl" onClick={handleCheckout}>Checkout Now</Button>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Main Content Area */}
        <section className="flex-1">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Sidebar Upgraded with Nice Background */}
              <aside className="w-full lg:w-64 flex-shrink-0">
                <div className="sticky top-[150px] p-6 rounded-[24px] overflow-hidden relative group">
                  {/* Sidebar Visual Background */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000"
                      className="w-full h-full object-cover opacity-10 group-hover:opacity-15 transition-opacity"
                      alt="Sidebar Background"
                    />
                    <div className="absolute inset-0 bg-[#f8f9fa] dark:bg-[#1A1028] opacity-70 backdrop-blur-xl" />
                    <div className="absolute inset-0 border border-black/5 dark:border-white/5" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8 px-2 text-[#FF6B35] uppercase text-[10px] font-black tracking-[0.2em]">Category List</div>
                    <nav className="flex flex-col gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-all rounded-xl flex items-center justify-between group/item ${activeCategory === cat
                            ? 'bg-[#FF6B35] text-white shadow-[0_8px_20px_rgba(255,107,53,0.3)] scale-[1.02]'
                            : 'text-muted-foreground hover:bg-white dark:hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                            }`}
                        >
                          <span className="truncate">{cat}</span>
                          {activeCategory === cat ? (
                            <ArrowRight className="w-4 h-4 animate-in slide-in-from-left-2 duration-300" />
                          ) : (
                            <Tag className="w-3.5 h-3.5 opacity-30 group-hover/item:opacity-100 transition-opacity" />
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>

              {/* Product Right Area */}
              <div className="flex-1">
                {/* High-Impact Vibrant Promotional Banner */}
                <div className="relative overflow-hidden rounded-[32px] bg-[#FF6B35] min-h-[280px] p-10 md:p-14 mb-14 flex flex-col md:flex-row items-center justify-between group shadow-[0_20px_50px_rgba(255,107,53,0.2)] border-none">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

                  <div className="relative z-10 text-black text-center md:text-left max-w-md">
                    <span className="inline-block text-black/60 font-black tracking-[0.2em] text-[10px] uppercase mb-4">Elite Creative Studio</span>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 md:mb-8 leading-tight tracking-tight text-black">Elevate your agency with <span className="text-white">elite designs</span></h2>
                    <Button className="bg-white text-black hover:bg-white/90 rounded-none font-black px-8 h-12 text-base flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all hover:scale-105 active:scale-95 border-none w-fit mx-auto md:mx-0" asChild>
                      <Link to="/contact">
                        Get Custom Design
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>

                  <div className="relative w-full md:w-[45%] h-64 mt-12 md:mt-0 hidden lg:block overflow-hidden rounded-2xl">
                    {products.length > 0 ? (
                      <AnimatePresence mode="wait">
                        {(() => {
                          const [currentIndex, setCurrentIndex] = useState(0);
                          useEffect(() => {
                            const timer = setInterval(() => {
                              setCurrentIndex((prev) => (prev + 1) % Math.min(products.length, 5));
                            }, 3500);
                            return () => clearInterval(timer);
                          }, []);

                          const featuredProd = products[currentIndex];
                          return (
                            <motion.div
                              key={featuredProd.id}
                              initial={{ opacity: 0, x: 50, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -50, scale: 0.95 }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                              className="absolute inset-0 flex items-center justify-center p-4 bg-black/10 backdrop-blur-xl rounded-[24px] border border-white/10 group/item"
                            >
                              <div className="flex gap-6 w-full h-full items-center">
                                <div className="w-1/2 aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transform group-hover/item:scale-105 transition-transform duration-700">
                                  <img src={featuredProd.image_url || ''} className="w-full h-full object-cover" alt={featuredProd.title} />
                                </div>
                                <div className="flex-1 flex flex-col justify-center text-white text-left">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35] mb-2">{featuredProd.category}</span>
                                  <h4 className="text-xl md:text-2xl font-black mb-2 line-clamp-1">{featuredProd.title}</h4>
                                  <div className="text-2xl md:text-3xl font-black mb-6 text-white">${featuredProd.price.toFixed(2)}</div>
                                  <Button size="sm" className="bg-[#FF6B35] hover:bg-[#E85D2A] text-white border-none w-fit font-black rounded-none px-6 h-10 shadow-lg shadow-orange-600/20 transition-all active:scale-95" onClick={() => navigate(`/product/${featuredProd.id}`)}>Take a Look</Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    ) : (
                      <div className="w-full h-full bg-black/20 rounded-2xl animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Grid Area - Optimized for High Density Mobile View */}
                {productsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8 md:gap-10">
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white dark:bg-card rounded-none overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_60px_rgba(0,0,0,0.08)] border border-border/40 transition-all flex flex-col h-full"
                      >
                        <div className="relative aspect-square sm:aspect-[16/11] overflow-hidden">
                          <OptimizedImage
                            src={product.image_url || ''}
                            alt={product.title}
                            width={600}
                            className="w-full h-full"
                            imageClassName="object-cover transition-transform duration-1000 group-hover:scale-105"
                          />
                          <div className="absolute top-2 right-2 md:top-5 md:right-5 bg-white/95 dark:bg-black/90 px-2 md:px-4 py-1 md:py-1.5 rounded-full shadow-lg z-10 border border-white/20">
                            <span className="text-[10px] md:text-base font-black text-foreground">${product.price.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="p-3 md:p-8 flex-1 flex flex-col">
                          <div className="mb-2 md:mb-4 text-left">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] px-2 md:px-4 py-1 md:py-2 rounded-full bg-orange-50 dark:bg-orange-950/20 text-[#FF6B35] border border-orange-100/50 dark:border-orange-900/30">
                              {product.category}
                            </span>
                          </div>
                          <h3 className="text-sm md:text-2xl font-bold text-foreground mb-1 md:mb-3 line-clamp-1 text-left">{product.title}</h3>
                          <p className="text-muted-foreground text-[10px] md:text-sm leading-relaxed mb-4 md:mb-8 line-clamp-1 md:line-clamp-2 text-left hidden sm:block">
                            {product.description || 'Premium design resources for your projects.'}
                          </p>
                          <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full">
                            <Button className="flex-[4] h-9 md:h-14 bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-black rounded-none shadow-lg shadow-orange-600/10 active:scale-95 transition-all text-[10px] md:text-base whitespace-nowrap" onClick={() => addToCartMutation.mutate(product.id)} disabled={addToCartMutation.isPending}>
                              <ShoppingCart className="w-3 h-3 md:w-5 md:h-5 mr-1.5 md:mr-3" /> Add
                            </Button>
                            <Button variant="outline" className="flex-1 h-9 md:h-14 border border-slate-200/60 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-accent bg-white dark:bg-transparent text-foreground rounded-none font-bold transition-all text-[10px] md:text-base" onClick={() => navigate(`/product/${product.id}`)}>
                              View
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Catchy Footer CTA Section */}
        <section className="relative py-32 overflow-hidden bg-[#1A1028]">
          {/* Vibrant & Beautiful Background Background Visual Layer */}
          <div className="absolute inset-0 z-0">
            <img
              src="/B3.jpg"
              className="w-full h-full object-cover opacity-80 brightness-95"
              alt="Premium Creative Workspace"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1028] via-transparent to-[#1A1028] opacity-40" />
            <div className="absolute inset-0 bg-black/25" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-7xl font-black mb-8 leading-tight text-white tracking-tighter [text-shadow:0_4px_30px_rgba(0,0,0,0.7)]">
                Start your next <span className="text-[#FF6B35]">success story.</span>
              </h2>
              <p className="text-white text-lg md:text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed [text-shadow:0_2px_15px_rgba(0,0,0,0.7)]">
                Elevate your agency with elite templates, high-performance design assets, and premium creative resources.
              </p>
              <Button className="h-16 px-14 bg-white hover:bg-white/90 text-black font-black text-xl rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all hover:scale-105 active:scale-95" asChild>
                <Link to="/contact">Request Custom Design</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Store;
