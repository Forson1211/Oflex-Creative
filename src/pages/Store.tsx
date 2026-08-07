import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
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
  Tag,
  Package,
  ShoppingBag,
  Heart,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  X
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

const templateFormats = [
  'All Formats',
  'Photoshop (.PSD)',
  'Illustrator (.AI)',
  'Canva Templates',
  'Figma Assets',
  'Print Ready PDF',
];

export const Store = () => {
  const [activeCategory, setActiveCategory] = useState('All Products');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'title'>('newest');

  const { user, isAuthReady } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getSetting, currencySymbol } = useSiteSettings();

  // Collapsible Accordion Card States
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(true);
  const [isFormatOpen, setIsFormatOpen] = useState(true);

  // Price Filter States
  const [pricePreset, setPricePreset] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);

  // Template Format Filter State
  const [activeFormat, setActiveFormat] = useState('All Formats');

  // Persisted Wishlist State (Shared with Profile page)
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oflex_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem('oflex_wishlist', JSON.stringify(updated));
      } catch (e) {}
      toast({ title: exists ? 'Removed from wishlist' : 'Added to wishlist!' });
      return updated;
    });
  };

  // Fetch active products
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

  // Dynamic Categories populated from DB
  const categories = useMemo(() => {
    if (products.length === 0) return ['All Products'];
    const unique = [...new Set(products.map(p => p.category))].filter(Boolean);
    return ['All Products', ...unique.sort()];
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCategory = activeCategory === 'All Products' || p.category === activeCategory;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = !searchLower || p.title.toLowerCase().includes(searchLower) || (p.description?.toLowerCase().includes(searchLower));
      
      let matchesPrice = true;
      if (appliedMinPrice !== null) matchesPrice = matchesPrice && p.price >= appliedMinPrice;
      if (appliedMaxPrice !== null) matchesPrice = matchesPrice && p.price <= appliedMaxPrice;

      let matchesFormat = true;
      if (activeFormat !== 'All Formats') {
        const fmtLower = activeFormat.toLowerCase().replace('templates', '').replace('assets', '').replace('.psd', 'psd').replace('.ai', 'ai').trim();
        matchesFormat = p.title.toLowerCase().includes(fmtLower) || (p.description?.toLowerCase().includes(fmtLower) ?? false) || (p.category.toLowerCase().includes(fmtLower));
      }

      return matchesCategory && matchesSearch && matchesPrice && matchesFormat;
    });

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result = [...result].sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime());
    }

    return result;
  }, [products, activeCategory, searchQuery, appliedMinPrice, appliedMaxPrice, activeFormat, sortBy]);

  // Price Filter Apply Handler
  const handleApplyPriceFilter = () => {
    if (pricePreset === 'all') {
      setAppliedMinPrice(null);
      setAppliedMaxPrice(null);
    } else if (pricePreset === 'below200') {
      setAppliedMinPrice(0);
      setAppliedMaxPrice(200);
    } else if (pricePreset === '200-500') {
      setAppliedMinPrice(200);
      setAppliedMaxPrice(500);
    } else if (pricePreset === '500-800') {
      setAppliedMinPrice(500);
      setAppliedMaxPrice(800);
    } else if (pricePreset === '800-1000') {
      setAppliedMinPrice(800);
      setAppliedMaxPrice(1000);
    } else if (pricePreset === '1000plus') {
      setAppliedMinPrice(1000);
      setAppliedMaxPrice(null);
    } else if (pricePreset === 'custom') {
      const min = minPriceInput ? parseFloat(minPriceInput) : null;
      const max = maxPriceInput ? parseFloat(maxPriceInput) : null;
      setAppliedMinPrice(min);
      setAppliedMaxPrice(max);
    }
    setIsFilterSheetOpen(false);
    toast({ title: 'Price filter applied' });
  };

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
  
  const posXDesktop = getSetting('store_banner_x_desktop', '50');
  const posYDesktop = getSetting('store_banner_y_desktop', '50');
  const posXMobile = getSetting('store_banner_x_mobile', '50');
  const posYMobile = getSetting('store_banner_y_mobile', '50');
  const overlayOpacity = Number(getSetting('store_banner_overlay_opacity', '70')) / 100;

  // Reusable Filter Cards JSX rendered in both sticky sidebar (desktop) and side sheet drawer (mobile)
  const filterCardsJSX = (
    <div className="space-y-6">
      {/* FILTER CARD 1: Categories Panel */}
      <div className="bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-none shadow-xs overflow-hidden">
        <button
          onClick={() => setIsCategoriesOpen(prev => !prev)}
          className="w-full p-4 flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span>Categories</span>
          {isCategoriesOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isCategoriesOpen && (
          <div className="p-3 space-y-1">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIsFilterSheetOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-none text-xs font-semibold transition-all flex items-center justify-between gap-2",
                    isSelected
                      ? "bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/25 font-bold"
                      : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FILTER CARD 2: Product Price Panel */}
      <div className="bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-none shadow-xs overflow-hidden">
        <button
          onClick={() => setIsPriceFilterOpen(prev => !prev)}
          className="w-full p-4 flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span>Product Price</span>
          {isPriceFilterOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isPriceFilterOpen && (
          <div className="p-4 space-y-4 text-xs">
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer text-slate-700 dark:text-white/80 font-medium">
                <input
                  type="radio"
                  name="pricePreset"
                  checked={pricePreset === 'all'}
                  onChange={() => setPricePreset('all')}
                  className="w-4 h-4 accent-[#FF5500]"
                />
                <span>All Price</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-700 dark:text-white/80 font-medium">
                <input
                  type="radio"
                  name="pricePreset"
                  checked={pricePreset === 'below200'}
                  onChange={() => setPricePreset('below200')}
                  className="w-4 h-4 accent-[#FF5500]"
                />
                <span>Below {currencySymbol}200</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-700 dark:text-white/80 font-medium">
                <input
                  type="radio"
                  name="pricePreset"
                  checked={pricePreset === '200-500'}
                  onChange={() => setPricePreset('200-500')}
                  className="w-4 h-4 accent-[#FF5500]"
                />
                <span>{currencySymbol}200 - {currencySymbol}500</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-700 dark:text-white/80 font-medium">
                <input
                  type="radio"
                  name="pricePreset"
                  checked={pricePreset === '500-800'}
                  onChange={() => setPricePreset('500-800')}
                  className="w-4 h-4 accent-[#FF5500]"
                />
                <span>{currencySymbol}500 - {currencySymbol}800</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-700 dark:text-white/80 font-medium">
                <input
                  type="radio"
                  name="pricePreset"
                  checked={pricePreset === '800-1000'}
                  onChange={() => setPricePreset('800-1000')}
                  className="w-4 h-4 accent-[#FF5500]"
                />
                <span>{currencySymbol}800 - {currencySymbol}1,000</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-700 dark:text-white/80 font-medium">
                <input
                  type="radio"
                  name="pricePreset"
                  checked={pricePreset === '1000plus'}
                  onChange={() => setPricePreset('1000plus')}
                  className="w-4 h-4 accent-[#FF5500]"
                />
                <span>{currencySymbol}1,000+</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Price Range:</span>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => {
                      setMinPriceInput(e.target.value);
                      setPricePreset('custom');
                    }}
                    className="w-full h-9 pl-7 pr-2 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
                <span className="text-slate-400 font-bold">–</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => {
                      setMaxPriceInput(e.target.value);
                      setPricePreset('custom');
                    }}
                    className="w-full h-9 pl-7 pr-2 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyPriceFilter}
              className="w-full h-10 bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold rounded-none text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-3"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* FILTER CARD 3: Template Format Panel */}
      <div className="bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-none shadow-xs overflow-hidden">
        <button
          onClick={() => setIsFormatOpen(prev => !prev)}
          className="w-full p-4 flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span>Template Format</span>
          {isFormatOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isFormatOpen && (
          <div className="p-3 space-y-1 text-xs">
            {templateFormats.map((fmt) => {
              const isSelected = activeFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => {
                    setActiveFormat(fmt);
                    setIsFilterSheetOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-none transition-all flex items-center justify-between gap-2 font-medium",
                    isSelected
                      ? "bg-[#FF5500]/10 text-[#FF5500] font-bold"
                      : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <span>{fmt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5500]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background">
        {/* Banner Header */}
        <div className="sticky top-0 z-[49]">
          <section 
            style={{ 
              ['--mobile-height' as any]: `${bannerHeightMobile}px`,
              ['--desktop-height' as any]: `${bannerHeightDesktop}px`
            }}
            className="relative bg-[#1A1028] h-[var(--mobile-height)] md:h-[var(--desktop-height)] border-b border-white/10 overflow-hidden shadow-2xl flex items-start md:items-center pt-24 md:pt-0"
          >
            <div className="absolute inset-0 z-0">
              {(bannerUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov|m4v|mkv)$/) || bannerUrl.includes('video')) ? (
                <video
                  src={bannerUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ 
                    ['--desktop-pos' as any]: `${posXDesktop}% ${posYDesktop}%`,
                    ['--mobile-pos' as any]: `${posXMobile}% ${posYMobile}%`,
                  } as any}
                  className={cn(
                    "w-full h-full object-cover grayscale-0 transition-all duration-700",
                    "object-[var(--mobile-pos)] md:object-[var(--desktop-pos)]"
                  )}
                />
              ) : (
                <OptimizedImage
                  src={bannerUrl}
                  className="w-full h-full"
                  style={{ 
                    ['--desktop-pos' as any]: `${posXDesktop}% ${posYDesktop}%`,
                    ['--mobile-pos' as any]: `${posXMobile}% ${posYMobile}%`,
                  } as any}
                  imageClassName={cn(
                    "w-full h-full object-cover grayscale-0 transition-all duration-700",
                    "object-[var(--mobile-pos)] md:object-[var(--desktop-pos)]"
                  )}
                  alt="Store Banner"
                  priority
                  width={1920}
                />
              )}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent transition-opacity duration-300" 
                style={{ opacity: overlayOpacity }}
              />
            </div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-widest font-black [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                  <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                  <span className="opacity-30">/</span>
                  <span className="text-white">Store Catalog</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                  <div className="max-w-[280px] sm:max-w-xl md:max-w-4xl mr-auto">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight [text-shadow:0_4px_25px_rgba(0,0,0,0.4)]">
                      {filteredProducts.length}+ Creative Products for{' '}
                      <span className="text-primary">
                        {searchQuery || 'Your Brand'}
                      </span>
                    </h1>
                  </div>

                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-96 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                      <Input
                        placeholder="Search products, designs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-white/20 backdrop-blur-md border border-white/30 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/80 text-lg rounded-none transition-all shadow-2xl"
                      />
                    </div>

                    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                      <SheetTrigger asChild>
                        <Button className="h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/30 px-8 font-bold text-sm flex items-center gap-3 rounded-none transition-transform active:scale-95 shadow-lg group">
                          <ShoppingCart className="w-5 h-5 text-white" />
                          <span className="hidden sm:inline">My Cart</span>
                          {cartCount > 0 && (
                            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                              {cartCount}
                            </span>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[85%] sm:w-[380px] max-w-[380px] sm:max-w-md flex flex-col bg-background border-l border-border">
                        <SheetHeader className="pb-6 border-b">
                          <SheetTitle className="text-2xl font-black flex items-center gap-3">
                            <ShoppingBag className="w-7 h-7 text-primary" />
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
                                <div key={item.id} className="flex gap-4 p-3 bg-accent/5 rounded-none border border-border/50">
                                  <div className="w-16 h-16 rounded-none bg-muted overflow-hidden flex-shrink-0">
                                    {item.product?.image_url && <img src={item.product.image_url} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="flex-1 flex flex-col justify-between">
                                    <h4 className="font-bold text-sm truncate">{item.product?.title}</h4>
                                    <p className="text-xs text-primary font-bold">{currencySymbol}{item.product?.price}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Button size="icon" variant="outline" className="h-6 w-6 rounded-none" onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}><Minus className="h-3 w-3" /></Button>
                                      <span className="text-xs font-medium">{item.quantity}</span>
                                      <Button size="icon" variant="outline" className="h-6 w-6 rounded-none" onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}><Plus className="h-3 w-3" /></Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto text-muted-foreground hover:text-red-500 rounded-none" onClick={() => removeFromCartMutation.mutate(item.id)}>
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
                              <div className="flex justify-between mb-4 font-bold text-lg"><span>Total</span><span>{currencySymbol}{cartTotal.toFixed(2)}</span></div>
                              <Button className="w-full h-12 bg-primary hover:bg-primary/90 font-bold text-white shadow-xl rounded-none" onClick={handleCheckout}>Checkout Now</Button>
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

        {/* Mobile Filter Slide Side Drawer (Zero layout shift, 100% steady background) */}
        <AnimatePresence>
          {isFilterSheetOpen && (
            <div className="fixed inset-0 z-[999] flex">
              {/* Dark Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsFilterSheetOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Side Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="relative z-10 w-[78%] sm:w-[320px] max-w-[320px] h-full bg-white dark:bg-[#1A1028] border-r border-slate-200 dark:border-white/10 flex flex-col shadow-2xl"
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-[#1A1028]">
                  <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#FF5500]" />
                    Filter Products
                  </div>
                  <button
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter Cards Container with smooth touch scrolling */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 touch-pan-y">
                  {filterCardsJSX}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Store Area */}
        <section className="flex-1">
          <div className="container mx-auto px-4 py-6 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8 xl:gap-10">
              
              {/* DESKTOP SIDEBAR FILTER CARDS */}
              <aside className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
                <div className="sticky top-28">
                  {filterCardsJSX}
                </div>
              </aside>

              {/* RIGHT MAIN CONTENT: Mobile Control Bar + Orange Banner Slide + Product Grid */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* MOBILE CONTROL BAR CARD (Visible only on mobile devices) */}
                <div className="lg:hidden bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/10 p-4 rounded-none shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/60">
                      <span>Categories</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-900 dark:text-white">{activeCategory}</span>
                    </div>
                    <span className="text-slate-400 text-xs font-medium">
                      Showing all {filteredProducts.length} items results
                    </span>
                  </div>

                  {/* Control Bar: Sort By Dropdown & FILTERS Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
                    <div className="w-full sm:w-64">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full h-10 px-3 text-xs font-bold bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/10 rounded-none text-slate-800 dark:text-white focus:outline-none focus:border-[#FF5500] cursor-pointer"
                      >
                        <option value="newest">Sort By: Newest</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="title">Name: A to Z</option>
                      </select>
                    </div>

                    <div className="w-full sm:w-auto">
                      <Button
                        onClick={() => setIsFilterSheetOpen(true)}
                        variant="outline"
                        className="w-full sm:w-auto h-10 px-6 border border-slate-200 dark:border-white/10 rounded-none text-xs font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-2 hover:border-[#FF5500] hover:text-[#FF5500] uppercase tracking-wider"
                      >
                        <Filter className="w-4 h-4 text-[#FF5500]" />
                        FILTERS
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* HIGH-IMPACT ORANGE BANNER SLIDE */}
                <div className="relative overflow-hidden rounded-none bg-gradient-to-r from-[#FF5500] to-[#ff8c42] p-6 md:p-12 text-white shadow-xl border border-white/10 group">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
                    <div className="max-w-md text-center lg:text-left">
                      <span className="inline-block text-white/80 font-bold tracking-[0.2em] text-[10px] uppercase mb-2">
                        ELITE CREATIVE STUDIO
                      </span>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black mb-4 leading-tight tracking-tight text-white">
                        Elevate your agency with <span className="underline decoration-white/30 underline-offset-4">elite designs</span>
                      </h2>
                      <Button
                        className="bg-white text-slate-900 hover:bg-white/90 font-black px-6 sm:px-8 h-10 sm:h-12 rounded-none text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                        asChild
                      >
                        <Link to="/contact">
                          Get Custom Design
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>

                    {/* Auto-Playing Featured Slide Card */}
                    <div className="relative w-full lg:w-[48%] h-48 md:h-60 overflow-hidden rounded-none">
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
                            if (!featuredProd) return null;

                            return (
                              <motion.div
                                key={featuredProd.id}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 p-3 sm:p-4 bg-black/20 backdrop-blur-md rounded-none border border-white/20 flex items-center gap-3 sm:gap-4"
                              >
                                <div className="w-2/5 aspect-square rounded-none overflow-hidden shadow-xl border border-white/30 shrink-0">
                                  <img
                                    src={featuredProd.image_url || '/placeholder.png'}
                                    className="w-full h-full object-cover"
                                    alt={featuredProd.title}
                                  />
                                </div>
                                <div className="flex-1 flex flex-col justify-center text-left">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">
                                    {featuredProd.category || 'Church Flyers'}
                                  </span>
                                  <h4 className="text-sm sm:text-base md:text-lg font-black text-white line-clamp-1 mb-1 sm:mb-2">
                                    {featuredProd.title}
                                  </h4>
                                  <div className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2 sm:mb-3">
                                    {currencySymbol}{featuredProd.price.toFixed(2)}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-white text-[#FF5500] hover:bg-white/90 font-bold rounded-none px-3 sm:px-4 h-7 sm:h-8 text-xs shadow-md w-fit"
                                    onClick={() => navigate(`/product/${featuredProd.id}`)}
                                  >
                                    Take a Look
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })()}
                        </AnimatePresence>
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-none animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>

                {/* PRODUCT GRID - SHARP EDGES 2-COLUMN MOBILE LAYOUT (Matching Image 1) */}
                {productsLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="h-72 sm:h-80 bg-slate-200 dark:bg-white/5 rounded-none animate-pulse" />
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="bg-white dark:bg-[#1A1028] border border-slate-200/80 dark:border-white/10 rounded-none p-2.5 sm:p-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group h-full"
                      >
                        {/* Product Image Box - Sharp Square Edges */}
                        <div className="aspect-square relative overflow-hidden rounded-none bg-slate-100 dark:bg-white/5 mb-2 sm:mb-3">
                          <OptimizedImage
                            src={product.image_url || ''}
                            alt={product.title}
                            width={600}
                            className="w-full h-full"
                            imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Quick View Floating Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/product/${product.id}`);
                            }}
                            className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-none bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 shadow-md hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        {/* Product Title & Details */}
                        <div className="flex flex-col flex-1">
                          <Link to={`/product/${product.id}`}>
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base leading-tight hover:text-[#FF5500] transition-colors line-clamp-1 text-left mb-1">
                              {product.title}
                            </h3>
                          </Link>

                          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 dark:text-white/40 mb-2 sm:mb-3">
                            <span className="truncate max-w-[55%]">{product.category || 'Templates'}</span>
                            <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[10px] sm:text-[11px] shrink-0">
                              <Check className="w-3 h-3 stroke-[2.5]" /> In stock
                            </span>
                          </div>

                          {/* Price Tag & Action Buttons Row */}
                          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/10 mt-auto">
                            <span className="font-black text-sm sm:text-lg text-[#FF5500]">
                              {currencySymbol}{product.price.toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleWishlist(product.id);
                                }}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-none border flex items-center justify-center transition-all active:scale-95 ${
                                  wishlist.includes(product.id)
                                    ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20'
                                    : 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-50 dark:bg-white/5'
                                }`}
                                title="Add to Wishlist"
                              >
                                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${wishlist.includes(product.id) ? 'fill-red-500' : ''}`} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  addToCartMutation.mutate(product.id);
                                }}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-[#FF5500] hover:bg-[#E04B00] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
                                title="Add to Cart"
                              >
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/10 rounded-none space-y-3">
                    <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-white/20" />
                    <p className="font-bold text-slate-700 dark:text-white text-base">No products match your filter</p>
                    <p className="text-xs text-slate-400">Try selecting a different category or resetting price filters.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Footer CTA Section */}
        <section className="relative py-28 overflow-hidden bg-[#1A1028]">
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
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-white tracking-tighter [text-shadow:0_4px_30px_rgba(0,0,0,0.7)]">
                Start your next <span className="text-primary">success story.</span>
              </h2>
              <p className="text-white text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed [text-shadow:0_2px_15px_rgba(0,0,0,0.7)]">
                Elevate your agency with elite templates, high-performance design assets, and premium creative resources.
              </p>
              <Button className="h-14 px-12 bg-white hover:bg-white/90 text-slate-900 font-black text-lg rounded-none shadow-2xl transition-all hover:scale-105 active:scale-95" asChild>
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
