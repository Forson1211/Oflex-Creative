import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminStats, useAdminActions, type AdminStatsResponse, ADMIN_STATS_KEYS } from '@/hooks/useAdminStats';
import { Package, ShoppingCart, DollarSign, Users, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Bell, Trash2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  completedOrders: number;
  pendingOrders: number;
}



const Dashboard = () => {
  const { data: adminStats, isLoading, isFetching, refetch } = useAdminStats();
  const { resetAnalytics } = useAdminActions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currencySymbol } = useSiteSettings();
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
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      label: 'Total Revenue',
      value: `${currencySymbol}${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-chart-3" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-chart-1" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-chart-3/20 text-chart-3';
      case 'pending':
        return 'bg-chart-1/20 text-chart-1';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Dashboard"
            description="Welcome to your admin dashboard"
            actions={
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="w-4 h-4 text-primary animate-pulse" />
                  <span>Real-time updates</span>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={resetAnalytics.isPending || loading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset Analytics
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
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

              </>
            }
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completedOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Site Analytics</h2>
            <AnalyticsCharts />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/admin/products"
                  className="block p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Manage Products</p>
                      <p className="text-sm text-muted-foreground">Add, edit, or remove products</p>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/admin/orders"
                  className="block p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">View Orders</p>
                      <p className="text-sm text-muted-foreground">Check and manage orders</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
                <Link to="/admin/orders" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-mono text-sm text-foreground">{order.id.slice(0, 8)}...</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()} • {order.payment_provider || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{currencySymbol}{Number(order.total_amount).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;
