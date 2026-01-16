import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Package, Settings, LogOut, ShoppingBag, Download, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Purchase {
  id: string;
  product_id: string;
  product_title: string;
  template_link: string | null;
  purchased_at: string;
}

const Profile = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user orders
  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user purchases (for downloads)
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });
      
      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out successfully' });
    navigate('/');
  };

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Layout>
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Welcome Header */}
            <div className="text-center mb-12">
              <Avatar className="w-24 h-24 mx-auto mb-6 border-4 border-primary">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                Welcome back, {displayName}!
              </h1>
              <p className="text-muted-foreground">
                {user.email}
              </p>
              {isAdmin && (
                <Badge variant="secondary" className="mt-2">
                  Admin
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <GlassCard className="p-6 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/store')}>
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">Browse Store</h3>
                <p className="text-sm text-muted-foreground">Explore our digital products</p>
              </GlassCard>
              
              <GlassCard className="p-6 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/contact')}>
                <Settings className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">Support</h3>
                <p className="text-sm text-muted-foreground">Get help with your orders</p>
              </GlassCard>
              
              {isAdmin && (
                <GlassCard className="p-6 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/admin')}>
                  <User className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold text-foreground mb-1">Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Manage your store</p>
                </GlassCard>
              )}
            </div>

            {/* Tabs for Orders and Downloads */}
            <Tabs defaultValue="downloads" className="w-full">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="downloads" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  My Downloads
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="downloads">
                <GlassCard className="p-6">
                  <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                    <Download className="w-5 h-5" />
                    Your Digital Products
                  </h2>

                  {purchases.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You haven't purchased any products yet.</p>
                      <Button onClick={() => navigate('/store')}>
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {purchase.product_title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Purchased {new Date(purchase.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            {purchase.template_link ? (
                              <Button size="sm" asChild>
                                <a href={purchase.template_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open Template
                                </a>
                              </Button>
                            ) : (
                              <Badge variant="secondary">Link coming soon</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="orders">
                <GlassCard className="p-6">
                  <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                    <Package className="w-5 h-5" />
                    Your Orders
                  </h2>

                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                      <Button onClick={() => navigate('/store')}>
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              ${order.total_amount.toFixed(2)}
                            </p>
                            <Badge
                              variant={order.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </TabsContent>
            </Tabs>

            {/* Sign Out */}
            <div className="text-center mt-8">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;
