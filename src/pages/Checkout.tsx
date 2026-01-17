import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle, ArrowLeft, Package, Wallet, Building2, Smartphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

type PaymentMethod = 'card' | 'paypal' | 'paystack' | 'bank';

const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Fetch products from secure public view (excludes sensitive columns like template_link)
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_public')
        .select('id, title, price, image_url');
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map((item) => ({
        ...item,
        product: products.find((p) => p.id === item.product_id),
      })) as CartItem[];
    },
    enabled: !!user && products.length > 0,
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user || cartItems.length === 0) throw new Error('Cart is empty');
      
      setIsProcessing(true);
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ 
          user_id: user.id, 
          total_amount: cartTotal, 
          status: 'completed' 
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

      // Fetch template links for purchased products (from full products table - only for creating purchase records)
      const productIds = cartItems.map(item => item.product_id);
      const { data: productDetails } = await supabase
        .from('products')
        .select('id, template_link')
        .in('id', productIds);

      const templateLinkMap = new Map(
        (productDetails || []).map(p => [p.id, p.template_link])
      );

      // Create purchase records for digital downloads
      const purchaseRecords = cartItems.map((item) => ({
        user_id: user.id,
        order_id: order.id,
        product_id: item.product_id,
        product_title: item.product?.title || 'Unknown',
        template_link: templateLinkMap.get(item.product_id) || null,
      }));

      const { error: purchaseError } = await supabase.from('purchases').insert(purchaseRecords);
      if (purchaseError) console.error('Error creating purchases:', purchaseError);

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
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setOrderComplete(true);
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Checkout failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      setIsProcessing(false);
    },
  });

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Please login to checkout</p>
              <Button onClick={() => navigate('/auth')}>Login</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (orderComplete) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Order Complete!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your purchase. Your digital products are now available in your account.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/profile')}>
                <Package className="w-4 h-4 mr-2" />
                View Downloads
              </Button>
              <Button variant="outline" onClick={() => navigate('/store')}>
                Continue Shopping
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button onClick={() => navigate('/store')}>Browse Products</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 min-h-screen">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/store')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.product?.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.product?.title}</h4>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground">$0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-3">
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Credit/Debit Card</p>
                        <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, etc.</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Wallet className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">PayPal</p>
                        <p className="text-sm text-muted-foreground">Pay with your PayPal account</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'paystack' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Paystack</p>
                        <p className="text-sm text-muted-foreground">Pay with mobile money, bank, or card (Africa)</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Bank Transfer</p>
                        <p className="text-sm text-muted-foreground">Manual bank transfer</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); checkoutMutation.mutate(); }} className="space-y-4">
                  {paymentMethod === 'card' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input id="cardName" placeholder="John Doe" required />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input 
                          id="cardNumber" 
                          placeholder="4242 4242 4242 4242" 
                          required
                          maxLength={19}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" required maxLength={5} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" placeholder="123" required maxLength={4} />
                        </div>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="p-6 rounded-lg bg-accent text-center">
                      <p className="text-foreground mb-2">You will be redirected to PayPal</p>
                      <p className="text-sm text-muted-foreground">Complete your payment securely with PayPal</p>
                    </div>
                  )}

                  {paymentMethod === 'paystack' && (
                    <div className="p-6 rounded-lg bg-accent text-center">
                      <p className="text-foreground mb-2">You will be redirected to Paystack</p>
                      <p className="text-sm text-muted-foreground">Pay with mobile money, bank, or card</p>
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-accent">
                        <p className="font-medium text-foreground mb-2">Bank Transfer Details:</p>
                        <p className="text-sm text-muted-foreground">
                          Bank: Example Bank<br />
                          Account Name: Oflex Creative<br />
                          Account Number: 1234567890<br />
                          Reference: Your Email
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        After making the transfer, your order will be processed within 24 hours.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={user.email || ''} 
                      required 
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        'Processing...'
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Pay ${cartTotal.toFixed(2)}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Secure checkout - Your payment info is protected
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
