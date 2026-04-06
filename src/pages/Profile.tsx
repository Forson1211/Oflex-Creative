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
  const { updateProfile } = useUserMutations();

  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const { cancelOrder } = useOrderMutations();

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
          setIsEditingProfile(false);
          toast({ title: 'Profile updated' });
        },
      }
    );
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
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

            {/* Profile Header - Modern & Integrated (No Banner) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-8 md:mb-12"
            >
              <GlassCard className="p-5 sm:p-8 md:p-12 border-primary/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-gradient-to-br from-card/60 via-card/40 to-background/60 backdrop-blur-3xl relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />

                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                  {/* Avatar with Multi-layer Glow */}
                  <div className="relative">
                    <div className="absolute inset-[-4px] bg-gradient-to-tr from-primary via-accent to-primary rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <Avatar className="w-28 h-28 sm:w-32 sm:h-32 md:w-44 md:h-44 border-[3px] md:border-[4px] border-background shadow-2xl relative z-10">
                      <AvatarImage src={getOptimizedImageUrl(profile?.avatar_url || '', 400)} className="object-cover" />
                      <AvatarFallback className="text-3xl sm:text-4xl md:text-6xl bg-muted text-primary font-bold">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
                      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2 sm:p-3 bg-primary text-white rounded-none shadow-2xl z-20 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    </label>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase">
                      Member of Creative Studio
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight text-foreground">
                          {isLoading ? "Loading..." : profile?.full_name || 'Creative Member'}
                        </h1>
                        {(isAdmin || isModerator) && (
                          <Badge className={cn(
                            "w-fit mx-auto md:mx-0 px-3 py-0.5 rounded-full text-[9px] font-bold tracking-widest border backdrop-blur-xl animate-pulse",
                            isAdmin
                              ? "bg-red-500/20 text-red-500 border-red-500/30"
                              : "bg-blue-500/20 text-blue-500 border-blue-500/30"
                          )}>
                            {isAdmin ? "ADMIN" : "MODERATOR"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 text-muted-foreground pt-1">
                        <div className="flex items-center gap-2 group/item">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <span className="text-sm sm:text-base font-semibold tracking-tight">{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 group/item">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <span className="text-sm sm:text-base font-semibold tracking-tight capitalize">
                            {isAdmin ? 'Owner' : isModerator ? 'Staff' : 'Pro Member'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-auto mt-4 md:mt-0 min-w-[180px]">
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      className="rounded-none h-11 sm:h-14 text-sm sm:text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
                    >
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="rounded-none h-11 sm:h-14 text-sm sm:text-base font-bold border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive transition-all gap-2"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-3 space-y-2">
                <div className="sticky top-28">
                  <GlassCard className="p-2 border-none shadow-lg">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-medium transition-all",
                          activeTab === item.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {activeTab === item.id && (
                          <motion.div layoutId="active-tab" className="ml-auto">
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </GlassCard>
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
                            <GlassCard key={i} className="p-6 border-none shadow-md hover:shadow-xl transition-shadow">
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
                          <GlassCard className="p-6 border-none shadow-md">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Recent Library Items
                              </h3>
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab('purchases')}>View All</Button>
                            </div>
                            <div className="space-y-4">
                              {purchases.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
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

                          <GlassCard className="p-6 border-none shadow-md">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Recent Orders
                              </h3>
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>View All</Button>
                            </div>
                            <div className="space-y-4">
                              {orders.slice(0, 3).map((order) => (
                                <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                                    <Badge variant="outline" className="text-[10px] p-1 font-mono">#{order.id.slice(0, 4)}</Badge>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">${Number(order.total_amount).toFixed(2)}</p>
                                    <Badge className="text-[10px] h-4 mt-1" variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                      {order.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              {orders.length === 0 && <p className="text-center py-6 text-muted-foreground italic">No orders yet.</p>}
                            </div>
                          </GlassCard>
                        </div>
                      </div>
                    )}

                    {activeTab === 'purchases' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-2xl font-bold tracking-tight">My Assets Library</h2>
                          <p className="text-sm text-muted-foreground">{purchases.length} Items Owned</p>
                        </div>
                        {purchasesLoading ? (
                          <div className="grid gap-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
                          </div>
                        ) : purchases.length === 0 ? (
                          <GlassCard className="p-12 text-center border-dashed border-2">
                            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold">Your library is empty</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Explore our store and get high-quality assets for your creative projects.</p>
                            <Button className="mt-6 rounded-none px-8" onClick={() => navigate('/store')}>Visit Shop</Button>
                          </GlassCard>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {purchases.map(purchase => (
                              <GlassCard key={purchase.id} className="p-5 border-none shadow-md group hover:shadow-xl transition-all">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">Digital Asset</Badge>
                                    <h3 className="font-bold text-lg mb-1 leading-tight group-hover:text-primary transition-colors">{purchase.product_title}</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> {new Date(purchase.purchased_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {purchase.file_url ? (
                                      <Button size="sm" className="rounded-none shadow-lg" asChild>
                                        <a href={purchase.file_url} download><Download className="w-4 h-4 mr-2" /> Download</a>
                                      </Button>
                                    ) : purchase.template_link && (
                                      <Button size="sm" variant="secondary" className="rounded-none" asChild>
                                        <a href={purchase.template_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-2" /> Access</a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </GlassCard>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'orders' && (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight mb-6">Order History</h2>
                        {ordersLoading ? (
                          <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
                          </div>
                        ) : orders.length === 0 ? (
                          <GlassCard className="p-12 text-center">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No orders found.</p>
                          </GlassCard>
                        ) : (
                          <div className="space-y-4">
                            {orders.map(order => (
                              <GlassCard key={order.id} className="p-6 border-none shadow-md">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Badge variant="secondary" className="font-mono">Order #{order.id.slice(0, 8)}</Badge>
                                      <Badge
                                        className="capitalize"
                                        variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                                      >
                                        {order.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Placed on {new Date(order.created_at).toLocaleString()}</p>

                                    <div className="mt-4 pt-4 border-t border-border/50">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Items</p>
                                      <ul className="space-y-2">
                                        {order.order_items?.map(item => (
                                          <li key={item.id} className="text-sm flex justify-between">
                                            <span>{item.product_title} <span className="text-muted-foreground">× {item.quantity}</span></span>
                                            <span className="font-medium">${Number(item.product_price * item.quantity).toFixed(2)}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="md:text-right flex flex-col justify-between items-end">
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase mb-1">Total Amount</p>
                                      <p className="text-2xl font-bold text-primary">${Number(order.total_amount).toFixed(2)}</p>
                                    </div>

                                    {order.status === 'pending' && (
                                      <Button variant="outline" size="sm" className="mt-4 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setOrderToCancel(order.id)}>
                                        Cancel Order
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </GlassCard>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'settings' && (
                      <GlassCard className="p-8 border-none shadow-lg max-w-2xl">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">Display Profile</h2>
                            <p className="text-sm text-muted-foreground">Update your public information</p>
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
                                className="pl-10"
                                placeholder="How should we call you?"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                              <Input value={user?.email} disabled className="pl-10 opacity-60" />
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
                      <GlassCard className="p-8 border-none shadow-lg max-w-2xl">
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
                                className="pl-10"
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
                                className="pl-10"
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
      </div>

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
          aspect={1}
        />
      )}

      {/* Edit Profile Dialog (Fallback) */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Public Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="modalName">Full Name</Label>
              <Input
                id="modalName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            <Button onClick={handleUpdateProfile} disabled={updateProfile.isPending} className="w-full rounded-none">
              {updateProfile.isPending ? 'Saving...' : 'Update Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Order Processing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone once confirmed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep My Order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
              onClick={() => {
                if (orderToCancel) {
                  cancelOrder.mutate(orderToCancel);
                  setOrderToCancel(null);
                }
              }}
            >
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Profile;
