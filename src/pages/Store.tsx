import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, X, ArrowRight, Eye, Plus, Minus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch products from database
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
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

  // Filter products
  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory);

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
      toast({ title: 'Added to cart', description: 'Item added successfully' });
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

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user || cartItems.length === 0) throw new Error('Cart is empty');

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_title: item.product?.title || 'Unknown',
        product_price: item.product?.price || 0,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (clearError) throw clearError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: 'Order placed!',
        description: 'Thank you for your purchase. Your order has been placed successfully.',
      });
      setIsCartOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Checkout failed', description: error.message, variant: 'destructive' });
    },
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              Digital Store
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Premium Digital Products
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover our collection of premium digital assets, templates, and AI prompts 
              to supercharge your creative workflow.
            </p>
            
            {/* Cart Button */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="relative">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  View Cart
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                  <SheetTitle>Shopping Cart ({cartCount} items)</SheetTitle>
                </SheetHeader>
                <div className="flex-1 flex flex-col mt-6 overflow-hidden">
                  {!user ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                      <p className="text-muted-foreground">Please login to view your cart</p>
                      <Button onClick={() => { setIsCartOpen(false); navigate('/auth'); }}>
                        Login
                      </Button>
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-4 pr-2">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 p-4 border border-border rounded-lg bg-card"
                          >
                            {item.product?.image_url && (
                              <img
                                src={item.product.image_url}
                                alt={item.product.title}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">
                                {item.product?.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
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
                                <span className="w-8 text-center text-foreground">{item.quantity}</span>
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
                                  className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
                                  onClick={() => removeFromCartMutation.mutate(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-4 mt-4">
                        <div className="flex justify-between text-lg font-semibold mb-4 text-foreground">
                          <span>Total:</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => checkoutMutation.mutate()}
                          disabled={checkoutMutation.isPending}
                        >
                          {checkoutMutation.isPending ? 'Processing...' : 'Complete Purchase'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
          >
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
          </motion.div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-[4/3] rounded-t-2xl" />
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
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {products.length === 0 
                  ? 'No products available yet. Check back soon!' 
                  : 'No products found in this category'}
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard className="overflow-hidden p-0 group">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop'}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon"
                            onClick={() => addToCartMutation.mutate(product.id)}
                            disabled={addToCartMutation.isPending}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background text-foreground text-sm font-bold shadow-lg">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-5">
                        <span className="text-xs text-primary font-medium uppercase tracking-wide">
                          {product.category}
                        </span>
                        <h3 className="font-semibold text-foreground mt-1 mb-2">{product.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                        <Button 
                          className="w-full mt-4" 
                          size="sm"
                          onClick={() => addToCartMutation.mutate(product.id)}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full bg-card border border-border rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => setSelectedProduct(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              
              <div className="grid md:grid-cols-2">
                <div className="aspect-square">
                  <img
                    src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop'}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <span className="text-xs text-primary font-medium uppercase tracking-wide">
                    {selectedProduct.category}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-2 mb-4">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">{selectedProduct.description}</p>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-bold text-foreground">${selectedProduct.price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">One-time purchase</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => {
                      addToCartMutation.mutate(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                    disabled={addToCartMutation.isPending}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              Need Something Custom?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Can't find what you're looking for? Let's create something unique for your needs.
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
