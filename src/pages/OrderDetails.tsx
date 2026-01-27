import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CreditCard, Package, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';

interface OrderItem {
    id: string;
    product_id: string;
    product_title: string;
    product_price: number;
    quantity: number;
}

interface Order {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_provider: string;
    order_items: OrderItem[];
    user_id: string;
}

const OrderDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currencySymbol } = useSiteSettings();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            if (!user || !id) throw new Error('Invalid request');

            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Simple security check
            if (data.user_id !== user.id) {
                // In a real app, RLS (Row Level Security) on Supabase should handle this,
                // but this is a good client-side fallback.
                throw new Error('Unauthorized');
            }

            return data as Order;
        },
        enabled: !!user && !!id,
        retry: false,
    });

    if (isLoading) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading order details...</div>
                </div>
            </Layout>
        );
    }

    if (error || !order) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <h1 className="text-2xl font-bold">Order not found</h1>
                    <p className="text-muted-foreground">The order you are looking for does not exist or you do not have permission to view it.</p>
                    <Button onClick={() => navigate('/profile')}>Back to Orders</Button>
                </div>
            </Layout>
        );
    }

    type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

    const getStatusColor = (status: string): BadgeVariant => {
        switch (status) {
            case 'completed': return 'default';
            case 'pending': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };


    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 mr-1" />;
            case 'pending': return <Clock className="w-4 h-4 mr-1" />;
            default: return null;
        }
    };

    return (
        <Layout>
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <Button
                        variant="ghost"
                        className="mb-6"
                        onClick={() => navigate('/profile')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Orders
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                                    Order #{order.id.slice(0, 8)}
                                </h1>
                                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={getStatusColor(order.status)} className="px-3 py-1 text-sm capitalize flex items-center">
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <GlassCard className="p-6">
                                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-primary" />
                                        Order Items
                                    </h2>
                                    <div className="space-y-4">
                                        {order.order_items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                                                <div>
                                                    <p className="font-medium text-foreground">{item.product_title}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity} × {currencySymbol}{item.product_price.toFixed(2)}</p>
                                                </div>
                                                <p className="font-semibold text-foreground">
                                                    {currencySymbol}{(item.quantity * item.product_price).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-6">
                                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                        Payment Details
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Payment Method</p>
                                            <p className="font-medium capitalize">{order.payment_provider}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Payment Status</p>
                                            <p className="font-medium capitalize">{order.status === 'completed' ? 'Paid' : order.status}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>

                            <div className="space-y-6">
                                <GlassCard className="p-6">
                                    <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{currencySymbol}{order.total_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span>{currencySymbol}0.00</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span className="text-primary">{currencySymbol}{order.total_amount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {order.status === 'completed' && (
                                        <Button className="w-full mt-6" variant="outline">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Invoice
                                        </Button>
                                    )}
                                </GlassCard>

                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-2">Need help with this order?</p>
                                    <Button variant="link" onClick={() => navigate('/contact')} className="text-primary">
                                        Contact Support
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
};

export default OrderDetail;
