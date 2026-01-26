import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, ArrowLeft, Package, Wallet, Smartphone, Loader2, DollarSign } from 'lucide-react';
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
import { formatPriceWithConversion } from '@/lib/currency';
import { getAbsoluteUrl } from '@/config/env';

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

type PaymentMethod = 'paystack' | 'paypal';

const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const verifyPayment = useCallback(async (reference: string) => {
    if (!user) return;

    setVerifyingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference }
      });

      if (error) throw error;

      if (data.success && data.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        queryClient.invalidateQueries({ queryKey: ['purchases'] });
        setOrderComplete(true);
        toast({ title: 'Payment successful!', description: 'Your order has been completed.' });
      } else {
        toast({
          title: 'Payment not completed',
          description: data.message || 'Please try again or contact support.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);

      let failMessage = 'Please contact support if payment was deducted.';
      if (error instanceof Error) {
        // Handle FunctionsHttpError or simple Error
        const msg = error.message;
        if (msg.includes('Payment service not configured')) {
          failMessage = 'Configuration Error: Payment service not set up properly.';
        } else if (msg.length < 100) {
          failMessage = msg;
        }
      }

      toast({
        title: 'Verification Failed',
        description: failMessage,
        variant: 'destructive'
      });
    } finally {
      setVerifyingPayment(false);
    }
  }, [user, queryClient, toast]);

  // Check for payment callback
  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    if (reference || trxref) {
      verifyPayment(reference || trxref!);
    }
  }, [searchParams, verifyPayment]);

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');
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
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as CartItem[];
    },
    enabled: !!user,
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  // Create pending order and initialize payment
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user || cartItems.length === 0) throw new Error('Cart is empty');
      if (!user.email) throw new Error('Email is required');

      setIsProcessing(true);

      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          status: 'pending',
          payment_provider: paymentMethod
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_title: item.product?.title || 'Unknown',
        product_price: item.product?.price || 0,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (paymentMethod === 'paystack') {
        const callbackUrl = getAbsoluteUrl('/checkout');

        try {
          const { data, error: functionError } = await supabase.functions.invoke('paystack-initialize', {
            body: {
              orderId: order.id,
              email: user.email,
              amount: cartTotal,
              callbackUrl
            }
          });

          if (functionError) {
            console.error('Edge Function Error details:', functionError);
            throw functionError;
          }

          if (!data?.success) {
            throw new Error(data?.error || 'Failed to initialize payment');
          }

          // Redirect to Paystack
          window.location.href = data.authorizationUrl;
          return { redirecting: true };
        } catch (err: unknown) {
          console.error('Call to paystack-initialize failed:', err);
          const errorMessage = err instanceof Error ? err.message : 'Payment service is currently unavailable';
          throw new Error(errorMessage);
        }
      } else {
        toast({
          title: 'PayPal Coming Soon',
          description: 'PayPal integration is being set up. Please use Paystack for now.',
          variant: 'destructive'
        });
        throw new Error('PayPal not yet available');
      }
    },
    onSuccess: (data) => {
      if (!data?.redirecting) {
        setIsProcessing(false);
      }
    },
    onError: (error: Error) => {
      console.error('Checkout error details:', error);

      // Try to extract a specific error message
      let errorMessage = error.message || 'Unknown error occurred';

      // Check for Supabase Edge Function specific error structures
      if (errorMessage.includes('FunctionsHttpError')) {
        try {
          const errorBody = JSON.parse(errorMessage);
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) {
          // Keep original message if parsing fails
        }
      }

      const errorWithContext = error as { context?: { message?: string } };
      if (errorWithContext.context?.message) {
        errorMessage = errorWithContext.context.message;
      }

      toast({
        title: 'Checkout Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
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

  if (verifyingPayment) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Verifying Payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </motion.div>
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
            <h1 className="text-3xl font-bold text-foreground mb-4">Payment Successful!</h1>
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
                    <span className="text-muted-foreground">Subtotal (USD)</span>
                    <span className="text-foreground">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground">$0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total (USD)</span>
                    <span className="text-primary">${cartTotal.toFixed(2)}</span>
                  </div>
                  {paymentMethod === 'paystack' && (
                    <div className="flex justify-between text-sm text-muted-foreground bg-accent/50 rounded-lg p-2 mt-2">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Amount in GHS
                      </span>
                      <span className="font-medium">{formatPriceWithConversion(cartTotal).ghs}</span>
                    </div>
                  )}
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
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'paystack' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Paystack</p>
                        <p className="text-sm text-muted-foreground">Pay with card, bank transfer, or mobile money</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-border'} opacity-50`}>
                    <RadioGroupItem value="paypal" id="paypal" disabled />
                    <Label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Wallet className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">PayPal</p>
                        <p className="text-sm text-muted-foreground">Coming soon</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Secure Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethod === 'paystack' && (
                    <div className="p-6 rounded-lg bg-accent text-center">
                      <Smartphone className="w-12 h-12 text-primary mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-2">Pay securely with Paystack</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        You'll be redirected to Paystack to complete your payment using card, bank transfer, or mobile money.
                      </p>
                      <p className="text-sm font-medium text-primary">
                        Amount: {formatPriceWithConversion(cartTotal).ghs} (≈ ${cartTotal.toFixed(2)} USD)
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email for receipt</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Your receipt will be sent to this email</p>
                  </div>

                  <div className="pt-4">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => checkoutMutation.mutate()}
                      disabled={isProcessing || checkoutMutation.isPending}
                    >
                      {isProcessing || checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Pay ${cartTotal.toFixed(2)}
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>Secured by Paystack - Your payment information is safe</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
