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
                        {activeTab === item.id ? (
                          <motion.div layoutId="active-tab" className="ml-auto">
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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

                          <GlassCard className="p-6 border border-border/50 shadow-none">
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
                              <GlassCard key={purchase.id} className="p-5 border border-border/50 shadow-none group hover:bg-muted/5 transition-colors">
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
                                      <Button size="sm" className="rounded-none shadow-none" asChild>
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
                              <GlassCard key={order.id} className="p-6 border border-border/50 shadow-none">
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
                      <GlassCard className="p-8 border border-border/50 shadow-none max-w-2xl">
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
