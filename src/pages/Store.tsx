import { useState } from 'react';
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
  Star,
  Heart,
  Sparkles,
  Tag,
  Package
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSiteSettings } from '@/hooks/useSiteSettings';

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
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getSetting } = useSiteSettings();

  // Fetch products from secure public view (excludes sensitive columns like template_link)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_public')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch cart items
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Attach product data
      const itemsWithProducts = data.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return { ...item, product };
      });

      return itemsWithProducts as CartItem[];
    },
    enabled: !!user && products.length > 0,
  });

  // Get unique categories
  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => {
      if (!p.is_active) return false;
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return matchesCategory;
      
      const matchesSearch = 
        p.title.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        p.category.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0; // Already sorted by newest from query
      }
    });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Please login to add items to cart');

      // Check if item already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Added to cart!', description: 'Item added successfully' });
    },
    onError: (error: Error) => {
      if (error.message.includes('login')) {
        toast({ 
          title: 'Please login', 
          description: 'You need to login to add items to cart',
          action: <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>Login</Button>
        });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  // Update cart quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Removed from cart' });
    },
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Premium Digital Products
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight"
            >
              {getSetting('store_title', 'Canva Templates & Digital Assets')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground mb-8"
            >
              {getSetting('store_description', 'Professional Canva templates, social media kits, and digital assets to elevate your brand and boost your creativity.')}
            </motion.p>
            
            {/* Search and Cart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 rounded-full border-border/50 bg-background/50 backdrop-blur-sm"
                />
              </div>
              
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button size="lg" className="relative rounded-full h-12 px-6">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Cart
                    {cartCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col bg-background">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Shopping Cart ({cartCount} items)
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 flex flex-col mt-6 overflow-hidden">
                    {!user ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Please login to view your cart</p>
                        <Button onClick={() => { setIsCartOpen(false); navigate('/auth'); }}>
                          Login to Continue
                        </Button>
                      </div>
                    ) : cartItems.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Your cart is empty</p>
                        <Button variant="outline" onClick={() => setIsCartOpen(false)}>
                          Continue Shopping
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-auto space-y-4 pr-2">
                          {cartItems.map((item) => (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex gap-4 p-4 border border-border rounded-xl bg-card"
                            >
                              {item.product?.image_url && (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.title}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">
                                  {item.product?.title}
                                </h4>
                                <p className="text-sm text-primary font-semibold">
                                  ${item.product?.price?.toFixed(2)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateQuantityMutation.mutate({
                                        itemId: item.id,
                                        quantity: item.quantity - 1,
                                      })
                                    }
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center text-foreground font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateQuantityMutation.mutate({
                                        itemId: item.id,
                                        quantity: item.quantity + 1,
                                      })
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeFromCartMutation.mutate(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="border-t border-border pt-4 mt-4 space-y-4">
                          <div className="flex justify-between text-lg font-semibold text-foreground">
                            <span>Total:</span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCheckout}
                          >
                            Proceed to Checkout
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {/* Filters and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            {/* Category Filter */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
            
            {/* Sort and View controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                <span>{filteredProducts.length} products found</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-40">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode('list')}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Products Grid/List */}
          {productsLoading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className={`bg-muted rounded-2xl ${viewMode === 'grid' ? 'aspect-[4/3]' : 'h-32'}`} />
                  <div className="p-5 bg-card rounded-b-2xl border border-border border-t-0">
                    <div className="h-3 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-4" />
                    <div className="h-9 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground text-lg">
                {products.length === 0 
                  ? 'No products available yet. Check back soon!' 
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                >
                  Clear filters
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              layout
              className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {viewMode === 'grid' ? (
                      <GlassCard className="overflow-hidden p-0 group h-full flex flex-col">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop'}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="rounded-full shadow-lg"
                              onClick={() => navigate(`/product/${product.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon"
                              className="rounded-full shadow-lg"
                              onClick={() => addToCartMutation.mutate(product.id)}
                              disabled={addToCartMutation.isPending}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-foreground text-sm font-bold shadow-lg">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <Badge variant="secondary" className="w-fit mb-2 text-xs">
                            {product.category}
                          </Badge>
                          <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{product.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{product.description}</p>
                          <div className="flex gap-2 mt-4">
                            <Button 
                              className="flex-1" 
                              size="sm"
                              onClick={() => addToCartMutation.mutate(product.id)}
                              disabled={addToCartMutation.isPending}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/product/${product.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    ) : (
                      <GlassCard className="overflow-hidden p-0 group">
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                            <img
                              src={product.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop'}
                              alt={product.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-6 flex-1 flex flex-col justify-center">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <Badge variant="secondary" className="mb-2 text-xs">
                                  {product.category}
                                </Badge>
                                <h3 className="font-semibold text-foreground text-lg mb-2">{product.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex gap-3 mt-auto">
                              <Button 
                                onClick={() => addToCartMutation.mutate(product.id)}
                                disabled={addToCartMutation.isPending}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => navigate(`/product/${product.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Custom Designs Available
            </div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-6">
              Need Something Custom?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Can't find what you're looking for? I create custom Canva templates and designs tailored to your brand.
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">
                Get Custom Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Store;
