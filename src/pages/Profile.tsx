import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  User, Package, Settings, LogOut, ShoppingBag,
  Download, ExternalLink, Edit2, Camera, Trash2,
  Shield, CreditCard, Bell, Heart, Calendar,
  ChevronRight, Lock, Mail, UserCircle, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useProfile, useUserMutations } from '@/hooks/useUsers';
import { useOrders, useOrderMutations } from '@/hooks/useOrders';
import { usePurchases } from '@/hooks/usePurchases';
import { useProducts } from '@/hooks/useProducts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useImageUpload } from '@/hooks/useImageUpload';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageCropper } from '@/components/ui/ImageCropper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Profile = () => {
  const { user, signOut, loading: authLoading, isAuthReady, isAdmin, isModerator } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: orders = [], isLoading: ordersLoading } = useOrders({ userId: user?.id });
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: allProducts = [] } = useProducts({ isActive: true });
  const { currencySymbol } = useSiteSettings();
  const { updateProfile } = useUserMutations();

  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const { cancelOrder } = useOrderMutations();

  // Wishlist State (synced with localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oflex_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const removeFromWishlist = (id: string) => {
    setWishlistIds(prev => {
      const updated = prev.filter(itemId => itemId !== id);
      try {
        localStorage.setItem('oflex_wishlist', JSON.stringify(updated));
      } catch (e) {}
      toast({ title: 'Removed from wishlist' });
      return updated;
    });
  };

  const wishlistProducts = useMemo(() => {
    return allProducts.filter(p => wishlistIds.includes(p.id));
  }, [allProducts, wishlistIds]);

  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // Statistics
  const stats = useMemo(() => {
    const totalSpent = orders.reduce((acc, order) => acc + (order.status === 'completed' ? Number(order.total_amount) : 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    return {
      totalSpent,
      completedOrders,
      itemsOwned: purchases.length,
      memberSince: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'
    };
  }, [orders, purchases, profile]);

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
          toast({ title: 'Profile updated successfully' });
          setIsEditingProfile(false);
        },
      }
    );
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const { uploadImage: uploadAvatar, isUploading: isUploadingAvatar } = useImageUpload({
    bucket: 'avatars',
    onSuccess: (url) => {
      if (!user?.id) return;
      updateProfile.mutate(
        { userId: user.id, data: { avatar_url: url } },
        {
          onSuccess: () => {
            toast({ title: 'Profile picture updated' });
          },
        }
      );
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.id) return;
    setImageToCrop(null);
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    uploadAvatar(file, user.id);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases', label: 'My Library', icon: Package },
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, count: wishlistProducts.length },
    { id: 'settings', label: 'Account Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const isLoading = authLoading || !isAuthReady || profileLoading;

  return (
    <Layout>
      <div className="min-h-screen bg-background/50 pt-16 md:pt-24 pb-12 overflow-hidden relative">
        {/* Luxury Background Orbs */}
        <div className="absolute top-40 left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-20 right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px] -z-10 animate-pulse delay-1000" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-3 space-y-4">
                <div className="sticky top-28 space-y-4">
                  
                  {/* Vertical Profile Info Card */}
                  <GlassCard className="p-6 flex flex-col items-center text-center border-border/50 shadow-none">
                    <div className="relative mb-4 group">
                      <Avatar className="w-24 h-24 border-[3px] border-background shadow-none relative z-10 transition-transform duration-300 group-hover:scale-105">
                        <AvatarImage src={getOptimizedImageUrl(profile?.avatar_url || '', 200)} className="object-cover" />
                        <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </Avatar>
                      <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploadingAvatar}
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-md border-[2px] border-background z-20 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                    </div>

                    <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">
                      {isLoading ? 'Loading...' : profile?.full_name || 'Creative Member'}
                    </h2>
                    <Badge className={cn(
                      "mb-4 uppercase text-[10px] font-bold tracking-widest px-3 py-1",
                      isAdmin ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}>
                      {isAdmin ? 'ADMINISTRATOR' : isModerator ? 'MODERATOR' : 'PRO MEMBER'}
                    </Badge>

                    <div className="w-full text-left space-y-2 mt-2">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-none bg-muted hover:bg-muted/80 transition-colors">
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate font-medium">{user?.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-none bg-muted hover:bg-muted/80 transition-colors">
                        <Shield className="w-4 h-4 text-primary shrink-0" />
                        <span className="capitalize font-medium">Role: {isAdmin ? 'Admin' : isModerator ? 'Staff' : 'User'}</span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Navigation Menu */}
                  <GlassCard className="p-2 border border-border/50 shadow-none">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-bold transition-all group",
                          activeTab === item.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                        {item.count !== undefined && item.count > 0 && (
                          <span className="ml-auto bg-[#FF5500] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {item.count}
                          </span>
                        )}
                        {activeTab === item.id ? (
                          <motion.div layoutId="active-tab" className={item.count ? "ml-1" : "ml-auto"}>
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", item.count ? "ml-1" : "ml-auto")} />
                        )}
                      </button>
                    ))}
                  </GlassCard>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full rounded-none h-12 text-sm font-bold shadow-none transition-all gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="w-full rounded-none h-12 text-sm font-bold border-border/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>

                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'dashboard' && (
                      <div className="space-y-6">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { label: 'Purchases', value: stats.itemsOwned, icon: Package, color: 'text-blue-500' },
                            { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-green-500' },
                            { label: 'Completed', value: stats.completedOrders, icon: Calendar, color: 'text-purple-500' },
                            { label: 'Member Since', value: stats.memberSince, icon: UserCircle, color: 'text-amber-500' },
                          ].map((stat, i) => (
                            <GlassCard key={i} className="p-6 border border-border/50 shadow-none hover:bg-muted/5 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl bg-muted", stat.color)}>
                                  <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                                </div>
                              </div>
                            </GlassCard>
                          ))}
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <GlassCard className="p-6 border border-border/50 shadow-none">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Recent Library Items
                              </h3>
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab('purchases')}>View All</Button>
                            </div>
                            <div className="space-y-4">
                              {purchases.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 rounded-none hover:bg-muted/50 transition-colors">
                                  <div className="w-12 h-12 bg-primary/10 rounded-none flex items-center justify-center">
                                    <Download className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{item.product_title}</p>
                                    <p className="text-xs text-muted-foreground">Purchased on {new Date(item.purchased_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ))}
                              {purchases.length === 0 && <p className="text-center py-6 text-muted-foreground italic">No assets yet.</p>}
                            </div>
                          </GlassCard>

                          <GlassCard className="p-6 border border-border/50 shadow-none">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Order History Summary
                              </h3>
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>View All</Button>
                            </div>
                            <div className="space-y-4">
                              {orders.slice(0, 3).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-none border border-border/30">
                                  <div>
                                    <p className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</p>
                                    <p className="text-sm font-bold text-primary">{currencySymbol}{Number(order.total_amount).toFixed(2)}</p>
                                  </div>
                                  <Badge variant={order.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                                    {order.status}
                                  </Badge>
                                </div>
                              ))}
                              {orders.length === 0 && <p className="text-center py-6 text-muted-foreground italic">No orders yet.</p>}
                            </div>
                          </GlassCard>
                        </div>
                      </div>
                    )}

                    {activeTab === 'purchases' && (
                      <GlassCard className="p-6 border border-border/50 shadow-none space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                          <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              <Package className="w-5 h-5 text-primary" />
                              My Digital Library ({purchases.length})
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">Access and download your purchased templates & assets anytime</p>
                          </div>
                        </div>

                        {purchases.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {purchases.map((item) => (
                              <div key={item.id} className="p-4 rounded-none border border-border/60 bg-card/40 flex flex-col justify-between space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-16 h-16 bg-primary/10 rounded-none flex items-center justify-center shrink-0">
                                    <Download className="w-8 h-8 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-base text-foreground truncate">{item.product_title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Purchased on {new Date(item.purchased_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <Button className="w-full rounded-none font-bold text-xs gap-2" asChild>
                                  <a href={item.product_image_url || '#'} download target="_blank" rel="noreferrer">
                                    <Download className="w-4 h-4" /> Download Digital File
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-muted-foreground space-y-3">
                            <Package className="w-12 h-12 mx-auto text-muted-foreground/30" />
                            <p className="font-bold text-base">Your digital library is empty</p>
                            <p className="text-xs">Purchased templates and products will appear here with instant download links.</p>
                            <Button className="mt-2 bg-primary text-white font-bold rounded-none" onClick={() => navigate('/store')}>
                              Browse Store
                            </Button>
                          </div>
                        )}
                      </GlassCard>
                    )}

                    {activeTab === 'orders' && (
                      <GlassCard className="p-6 border border-border/50 shadow-none space-y-6">
                        <div className="border-b pb-4">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            Order History ({orders.length})
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">Track and manage your past purchases</p>
                        </div>

                        {orders.length > 0 ? (
                          <div className="space-y-4">
                            {orders.map((order) => (
                              <div key={order.id} className="p-5 rounded-none border border-border/60 bg-card/40 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-3">
                                  <div>
                                    <span className="text-xs text-muted-foreground font-mono uppercase">Order ID</span>
                                    <p className="font-mono text-sm font-bold text-foreground">#{order.id}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground uppercase">Date</span>
                                    <p className="text-sm font-medium text-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground uppercase">Total</span>
                                    <p className="text-sm font-bold text-primary">{currencySymbol}{Number(order.total_amount).toFixed(2)}</p>
                                  </div>
                                  <Badge className="capitalize px-3 py-1">
                                    {order.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                  <span>Payment Method: <strong className="text-foreground capitalize">{order.payment_method || 'Online'}</strong></span>
                                  {order.status === 'pending' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="rounded-none text-xs h-8"
                                      onClick={() => setOrderToCancel(order.id)}
                                    >
                                      Cancel Order
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-muted-foreground space-y-3">
                            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30" />
                            <p className="font-bold text-base">No orders found</p>
                            <p className="text-xs">Your completed store purchases will be listed here.</p>
                          </div>
                        )}
                      </GlassCard>
                    )}

                    {/* NEW WISHLIST TAB */}
                    {activeTab === 'wishlist' && (
                      <GlassCard className="p-6 border border-border/50 shadow-none space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                          <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                              My Wishlist ({wishlistProducts.length})
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">Saved design templates and creative products</p>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-none font-bold" onClick={() => navigate('/store')}>
                            Browse Store
                          </Button>
                        </div>

                        {wishlistProducts.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {wishlistProducts.map((product) => (
                              <div key={product.id} className="bg-card border border-border rounded-none p-4 flex flex-col group hover:shadow-xl transition-all">
                                <div className="aspect-square relative overflow-hidden bg-muted mb-3 rounded-none">
                                  <img src={product.image_url || ''} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={product.title} />
                                  <button
                                    onClick={() => removeFromWishlist(product.id)}
                                    className="absolute top-2 right-2 p-2 bg-background/90 hover:bg-red-500 hover:text-white rounded-none text-muted-foreground transition-colors shadow-md"
                                    title="Remove from Wishlist"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <h4 className="font-bold text-base text-foreground truncate">{product.title}</h4>
                                <p className="text-xs text-muted-foreground mb-3">{product.category || 'Templates'}</p>
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                                  <span className="font-black text-lg text-primary">{currencySymbol}{product.price.toFixed(2)}</span>
                                  <Button size="sm" className="h-9 rounded-none text-xs font-bold bg-primary text-white hover:bg-primary/90" onClick={() => navigate(`/product/${product.id}`)}>
                                    View Product
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-16 text-center text-muted-foreground space-y-3">
                            <Heart className="w-14 h-14 mx-auto text-muted-foreground/30" />
                            <p className="font-bold text-lg text-foreground">Your Wishlist is empty</p>
                            <p className="text-xs max-w-sm mx-auto">Explore the store and click the heart icon on any product to save it here for quick access!</p>
                            <Button className="mt-2 bg-primary text-white font-bold rounded-none px-8" onClick={() => navigate('/store')}>
                              Go to Store
                            </Button>
                          </div>
                        )}
                      </GlassCard>
                    )}

                    {activeTab === 'settings' && (
                      <GlassCard className="p-8 border border-border/50 shadow-none max-w-2xl">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">Account Settings</h2>
                            <p className="text-sm text-muted-foreground">Manage your personal information</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pl-10 rounded-none"
                                placeholder="How should we call you?"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                              <Input value={user?.email} disabled className="pl-10 opacity-60 rounded-none" />
                            </div>
                            <p className="text-[10px] text-muted-foreground px-1">Email cannot be changed for security.</p>
                          </div>

                          <div className="pt-4">
                            <Button
                              onClick={handleUpdateProfile}
                              disabled={updateProfile.isPending}
                              className="w-full sm:w-auto px-8 rounded-none"
                            >
                              {updateProfile.isPending ? 'Saving...' : 'Save Profile Changes'}
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    )}

                    {activeTab === 'security' && (
                      <GlassCard className="p-8 border border-border/50 shadow-none max-w-2xl">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                            <Shield className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">Security Settings</h2>
                            <p className="text-sm text-muted-foreground">Keep your account secure</p>
                          </div>
                        </div>

                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="newPass">New Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="newPass"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pl-10 rounded-none"
                                placeholder="Min 6 characters"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPass">Confirm New Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="confirmPass"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 rounded-none"
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-border/50">
                            <h4 className="text-sm font-semibold mb-4 text-amber-500 flex items-center gap-2">
                              <Bell className="w-4 h-4" /> Recommended Security
                            </h4>
                            <ul className="space-y-2 mb-6">
                              <li className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full" /> Use at least 8 characters
                              </li>
                              <li className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full" /> Add special characters (@ # $)
                              </li>
                            </ul>

                            <Button type="submit" disabled={isUpdatingPassword} className="w-full sm:w-auto px-8 rounded-none">
                              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                          </div>
                        </form>
                      </GlassCard>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        {/* Avatar Image Cropper Modal */}
        {imageToCrop && (
          <ImageCropper
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={() => setImageToCrop(null)}
            aspectRatio={1}
          />
        )}

        {/* Order Cancel Confirmation Modal */}
        <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
          <AlertDialogContent className="rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The order status will be set to cancelled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none">Keep Order</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (orderToCancel) {
                    cancelOrder.mutate(orderToCancel, {
                      onSuccess: () => {
                        toast({ title: 'Order cancelled' });
                        setOrderToCancel(null);
                      }
                    });
                  }
                }}
              >
                Yes, Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
};

export default Profile;
