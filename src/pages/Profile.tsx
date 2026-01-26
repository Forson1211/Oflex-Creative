import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { User, Package, Settings, LogOut, ShoppingBag, Download, ExternalLink, Edit2, Camera, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useProfile, useUserMutations } from '@/hooks/useUsers';
import { useOrders } from '@/hooks/useOrders';
import { usePurchases, usePurchaseMutations } from '@/hooks/usePurchases';
import { ImageUpload } from '@/components/ui/ImageUpload';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ProfilePage = () => {
  const { user, signOut, isAdmin, isModerator, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    avatar_url: '',
  });

  const { uploadImage, isUploading } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => setEditForm((prev) => ({ ...prev, avatar_url: url })),
  });

  // Centralized Hooks
  const { data: profile } = useProfile(user?.id);
  const { data: orders = [] } = useOrders({ userId: user?.id });
  const { data: purchases = [] } = usePurchases();
  const { updateProfile } = useUserMutations();
  const { deletePurchase } = usePurchaseMutations();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/auth');
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    if (!user) return;
    updateProfile.mutate({
      userId: user.id,
      data: {
        full_name: editForm.full_name,
        avatar_url: editForm.avatar_url,
      }
    }, {
      onSuccess: () => setIsEditDialogOpen(false)
    });
  };

  // Loading state
  const isProfileUpdating = updateProfile.isPending;
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const getRoleBadge = () => {
    if (userRole === 'admin') return <Badge className="bg-destructive text-destructive-foreground">Admin</Badge>;
    if (userRole === 'moderator') return <Badge className="bg-primary text-primary-foreground">Moderator</Badge>;
    return <Badge variant="secondary">User</Badge>;
  };

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
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto mb-6 border-4 border-primary">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleEditProfile}
                  className="absolute bottom-4 right-0 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Camera className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                Welcome back, {displayName}!
              </h1>
              <p className="text-muted-foreground mb-3">
                {user.email}
              </p>
              <div className="flex items-center justify-center gap-2">
                {getRoleBadge()}
              </div>

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

              {(isAdmin || isModerator) && (
                <GlassCard className="p-6 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/admin')}>
                  <Shield className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold text-foreground mb-1">
                    {isAdmin ? 'Admin Dashboard' : 'Moderator Panel'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin ? 'Manage your store' : 'Manage content'}
                  </p>
                </GlassCard>
              )}
            </div>

            {/* Tabs for Profile, Downloads, and Orders */}
            <Tabs defaultValue="downloads" className="w-full">
              <TabsList className="w-full justify-start mb-6 overflow-x-auto">
                <TabsTrigger value="downloads" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  My Downloads
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order History
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Account Settings
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
                          <div className="flex items-center gap-2">
                            {purchase.template_link ? (
                              <Button size="sm" asChild>
                                <a href={purchase.template_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open
                                </a>
                              </Button>
                            ) : (
                              <Badge variant="secondary">Link coming soon</Badge>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove this purchase?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove "{purchase.product_title}" from your downloads. You won't be able to access the template link anymore.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deletePurchase.mutate(purchase.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card cursor-pointer hover:border-primary transition-colors"
                          onClick={() => navigate(`/order/${order.id}`)}
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

              <TabsContent value="settings">
                <GlassCard className="p-6">
                  <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                    <User className="w-5 h-5" />
                    Account Settings
                  </h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-muted-foreground">Full Name</Label>
                        <p className="font-medium text-foreground">{profile?.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium text-foreground">{user.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Account Type</Label>
                        <p className="font-medium text-foreground capitalize">{userRole || 'User'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Member Since</Label>
                        <p className="font-medium text-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={handleEditProfile}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="full_name">Full Name</Label>
                              <Input
                                id="full_name"
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                placeholder="Your full name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Profile Picture</Label>
                              <div className="flex flex-col gap-4">
                                <div className="flex justify-center">
                                  <ImageUpload
                                    value={editForm.avatar_url}
                                    onChange={(url) => setEditForm(prev => ({ ...prev, avatar_url: url }))}
                                    onUpload={uploadImage}
                                    isUploading={isUploading}
                                    aspectRatio="square"
                                    className="w-32 h-32"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="avatar_url" className="text-xs text-muted-foreground">Or enter URL manually</Label>
                                  <Input
                                    id="avatar_url"
                                    value={editForm.avatar_url}
                                    onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                                    placeholder="https://..."
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
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

export default ProfilePage;
