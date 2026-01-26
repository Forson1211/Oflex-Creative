import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { User, Package, Settings, LogOut, ShoppingBag, Download, ExternalLink, Edit2, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useProfile, useUserMutations } from '@/hooks/useUsers';
import { useOrders } from '@/hooks/useOrders';
import { usePurchases } from '@/hooks/usePurchases';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Profile = () => {
  const { user, signOut, loading: authLoading, isAuthReady } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: orders = [], isLoading: ordersLoading } = useOrders({ userId: user?.id });
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { updateProfile } = useUserMutations();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // Redirect to auth if not logged in
  if (isAuthReady && !authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    updateProfile.mutate(
      { userId: user.id, data: { full_name: fullName } },
      {
        onSuccess: () => {
          setIsEditingProfile(false);
          toast({ title: 'Profile updated successfully' });
        },
      }
    );
  };

  const isLoading = authLoading || !isAuthReady || profileLoading;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Profile Header */}
          <GlassCard className="p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {isLoading ? (
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  ) : (
                    profile?.full_name || 'User'
                  )}
                </h1>
                <p className="text-muted-foreground mb-4">{user?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="secondary">
                    <Package className="w-3 h-3 mr-1" />
                    {purchases.length} Purchases
                  </Badge>
                  <Badge variant="secondary">
                    <ShoppingBag className="w-3 h-3 mr-1" />
                    {orders.length} Orders
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={updateProfile.isPending}
                        className="w-full"
                      >
                        {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Tabs */}
          <Tabs defaultValue="purchases" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchases">My Purchases</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
            </TabsList>

            <TabsContent value="purchases" className="space-y-4">
              {purchasesLoading ? (
                <div className="grid gap-4">
                  {[...Array(3)].map((_, i) => (
                    <GlassCard key={i} className="p-6 animate-pulse">
                      <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </GlassCard>
                  ))}
                </div>
              ) : purchases.length === 0 ? (
                <GlassCard className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No purchases yet</p>
                  <Button className="mt-4" onClick={() => navigate('/store')}>
                    Browse Store
                  </Button>
                </GlassCard>
              ) : (
                <div className="grid gap-4">
                  {purchases.map((purchase) => (
                    <GlassCard key={purchase.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {purchase.product_title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Purchased on {new Date(purchase.purchased_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        {purchase.template_link && (
                          <Button asChild size="sm">
                            <a href={purchase.template_link} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              {ordersLoading ? (
                <div className="grid gap-4">
                  {[...Array(3)].map((_, i) => (
                    <GlassCard key={i} className="p-6 animate-pulse">
                      <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </GlassCard>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <GlassCard className="p-12 text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders yet</p>
                </GlassCard>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <GlassCard key={order.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            ${Number(order.total_amount).toFixed(2)}
                          </p>
                          <Badge
                            variant={
                              order.status === 'completed'
                                ? 'default'
                                : order.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="border-t border-border pt-4">
                          <p className="text-sm text-muted-foreground mb-2">Items:</p>
                          <ul className="space-y-1">
                            {order.order_items.map((item) => (
                              <li key={item.id} className="text-sm text-foreground">
                                {item.product_title} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
