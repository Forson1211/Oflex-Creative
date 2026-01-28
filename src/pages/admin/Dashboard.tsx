import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminStats, useAdminActions, ADMIN_STATS_KEYS } from '@/hooks/useAdminStats';
import {
  Package, ShoppingCart, DollarSign, Users,
  Clock, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Bell, Trash2, Hammer, ArrowRight, Activity
} from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useSiteSettingsMutations } from '@/hooks/useSiteSettings';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { data: adminStats, isLoading, isFetching } = useAdminStats();
  const { resetAnalytics } = useAdminActions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currencySymbol, maintenanceMode } = useSiteSettings();
  const { updateSetting } = useSiteSettingsMutations();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_STATS_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: ADMIN_STATS_KEYS.analytics }),
      ]);
      toast({ title: 'Dashboard refreshed!' });
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const loading = isLoading || isFetching || isManualRefreshing;

  const stats = {
    totalProducts: adminStats?.total_products || 0,
    totalOrders: adminStats?.total_orders || 0,
    totalRevenue: Number(adminStats?.total_revenue) || 0,
    totalUsers: adminStats?.total_users || 0,
    completedOrders: adminStats?.completed_orders || 0,
    pendingOrders: adminStats?.pending_orders || 0,
  };

  const recentOrders = adminStats?.recent_orders || [];

  const statCards = [
    {
      label: 'Products',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-500',
      border: 'border-blue-500/20'
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      gradient: 'from-violet-500/20 to-violet-600/20',
      iconColor: 'text-violet-500',
      border: 'border-violet-500/20'
    },
    {
      label: 'Total Revenue',
      value: `${currencySymbol}${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: 'from-emerald-500/20 to-emerald-600/20',
      iconColor: 'text-emerald-500',
      border: 'border-emerald-500/20'
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-amber-500/20 to-amber-600/20',
      iconColor: 'text-amber-500',
      border: 'border-amber-500/20'
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500';
      case 'pending': return 'bg-amber-500/10 text-amber-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-8 animate-in fade-in duration-500">
          <AdminPageHeader
            title="Dashboard Overview"
            description="Welcome back to your command center"
            actions={
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/50 text-xs font-medium text-muted-foreground border border-border/50">
                  <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                  <span>Real-time</span>
                </div>

                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={resetAnalytics.isPending || loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Dashboard Statistics?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear all chart history, daily analytics data, AND delete all PENDING orders.
                          Completed orders and user accounts will NOT be deleted.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetAnalytics.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {resetAnalytics.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                          Reset Analytics
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="h-9"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            }
          />

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-card/50 h-32 rounded-2xl animate-pulse border border-border/50" />
              ))
            ) : (
              statCards.map((stat, i) => (
                <GlassCard
                  key={stat.label}
                  hover={false}
                  className={`relative overflow-hidden border-t-4 ${stat.border}`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Status */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassCard hover={false} className="flex items-center justify-between bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{stats.completedOrders}</h4>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed Orders</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover={false} className="flex items-center justify-between bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-full">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{stats.pendingOrders}</h4>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Orders</p>
                  </div>
                </div>
                {stats.pendingOrders > 0 && (
                  <Button size="sm" variant="ghost" className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" asChild>
                    <Link to="/admin/orders">View</Link>
                  </Button>
                )}
              </GlassCard>
            </div>

            {/* Maintenance Toggle */}
            <GlassCard hover={false} className={`flex flex-col justify-center ${maintenanceMode ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${maintenanceMode ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold block">Maintenance</span>
                    <span className="text-xs text-muted-foreground">{maintenanceMode ? 'Site Offline' : 'Site Online'}</span>
                  </div>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={(checked) => updateSetting.mutate({ key: 'maintenance_mode', value: checked.toString() })}
                />
              </div>
            </GlassCard>
          </div>

          {/* Main Charts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Analytics & Trends</h2>
              <Badge variant="outline" className="text-xs font-normal">Last 7 Days</Badge>
            </div>
            <AnalyticsCharts />
          </div>

          {/* Bottom Grid: Recent Orders & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Orders - Takes 2 columns */}
            <div className="lg:col-span-2">
              <GlassCard hover={false} className="h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg">Recent Orders</h3>
                    <p className="text-sm text-muted-foreground">Latest transaction activity</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" asChild>
                    <Link to="/admin/orders">
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                      <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No orders yet.</p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="group flex items-center justify-between p-4 rounded-xl bg-card hover:bg-accent/50 border border-border/50 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()} • via {order.payment_provider || 'Direct'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{currencySymbol}{Number(order.total_amount).toFixed(2)}</p>
                          <Badge variant="secondary" className={`mt-1 text-[10px] capitalize ${getStatusColor(order.status)} border-0`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Quick Actions - Takes 1 column */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-lg px-1">Quick Actions</h3>
              <div className="grid gap-3">
                <Link to="/admin/products" className="group">
                  <GlassCard className="flex items-center gap-4 p-4 hover:border-primary/50 transition-colors">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">Manage Products</span>
                      <span className="text-xs text-muted-foreground">Add or edit inventory</span>
                    </div>
                  </GlassCard>
                </Link>

                <Link to="/admin/users" className="group">
                  <GlassCard className="flex items-center gap-4 p-4 hover:border-primary/50 transition-colors">
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">User Management</span>
                      <span className="text-xs text-muted-foreground">View and manage users</span>
                    </div>
                  </GlassCard>
                </Link>

                <Link to="/admin/customization" className="group">
                  <GlassCard className="flex items-center gap-4 p-4 hover:border-primary/50 transition-colors">
                    <div className="p-3 rounded-lg bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">Site Customization</span>
                      <span className="text-xs text-muted-foreground">Edit site appearance</span>
                    </div>
                  </GlassCard>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;
