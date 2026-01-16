import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Download, Check, Star, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image_url: string | null;
  description: string | null;
  template_link: string | null;
  is_active: boolean;
}

interface Purchase {
  id: string;
  product_id: string;
  template_link: string | null;
  product_title: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });

  // Check if user has purchased this product
  const { data: purchase } = useQuery({
    queryKey: ['purchase', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Purchase | null;
    },
    enabled: !!user && !!id,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login to add items to cart');
      if (!product) throw new Error('Product not found');

      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
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
          product_id: product.id,
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

  const hasPurchased = !!purchase;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading product...</div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <Button onClick={() => navigate('/store')}>Back to Store</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/store')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12"
          >
            {/* Product Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=800&fit=crop'}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {hasPurchased && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Purchased
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <Badge variant="secondary" className="w-fit mb-4">
                {product.category}
              </Badge>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {product.title}
              </h1>

              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-primary text-primary" />
                ))}
                <span className="text-sm text-muted-foreground ml-2">(4.9/5 rating)</span>
              </div>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {product.description || 'A premium digital product designed to enhance your creative workflow.'}
              </p>

              <Separator className="mb-8" />

              {/* Features */}
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-4">What's Included:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    Instant digital download
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    Lifetime access to template
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    Editable in Canva
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    Commercial use license
                  </li>
                </ul>
              </div>

              <div className="mt-auto">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold text-foreground">${product.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">one-time purchase</span>
                </div>

                {hasPurchased ? (
                  <div className="space-y-4">
                    {purchase?.template_link ? (
                      <Button 
                        size="lg" 
                        className="w-full"
                        asChild
                      >
                        <a href={purchase.template_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Template in Canva
                        </a>
                      </Button>
                    ) : (
                      <Button size="lg" className="w-full" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Download Link Coming Soon
                      </Button>
                    )}
                    <p className="text-sm text-center text-muted-foreground">
                      You already own this product. Access it anytime from your profile.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => addToCartMutation.mutate()}
                      disabled={addToCartMutation.isPending}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Secure checkout • Instant delivery after payment
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
