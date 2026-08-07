import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminStats, useAdminActions, ADMIN_STATS_KEYS } from '@/hooks/useAdminStats';
import {
  Package, ShoppingCart, DollarSign, Users,
  Clock, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Trash2, Hammer, ArrowRight, Activity,
  BarChart2, TrendingUp, TrendingDown, Plus,
  Download, Search as SearchIcon,
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
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useUsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  const { data: adminStats, isLoading, isFetching } = useAdminStats();
  const { resetAnalytics } = useAdminActions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currencySymbol, maintenanceMode } = useSiteSettings();
  const { updateSetting } = useSiteSettingsMutations();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("last7");
  const [orderSearch, setOrderSearch] = useState('');
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin';

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

  const recentOrders = (adminStats?.recent_orders || []).filter((o: any) => o.status !== 'archived');
  const filteredOrders = recentOrders.filter((o: any) =>
    !orderSearch || o.id.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      iconBg: 'bg-[#FF5500]',
      sub1: `${stats.totalProducts} active items`,
      sub2: null,
      trend: null,
      link: '/admin/products',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      iconBg: 'bg-violet-500',
      sub1: `${stats.completedOrders} completed`,
      sub2: `${stats.pendingOrders} pending`,
      trend: null,
      link: '/admin/orders',
    },
    {
      label: 'Total Revenue',
      value: `${currencySymbol}${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      iconBg: 'bg-emerald-500',
      sub1: 'All time earnings',
      sub2: null,
      trend: null,
      link: '/admin/orders',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      iconBg: 'bg-blue-500',
      sub1: 'Registered accounts',
      sub2: null,
      trend: null,
      link: '/admin/users',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'cancelled': return <XCircle className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-white/40';
    }
  };

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-7">

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-lato">
                {greeting()}, {firstName}! 👋
              </h1>
              <p className="text-sm text-slate-400 dark:text-white/40 mt-1">
                Here's what's happening with your creative studio today.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 h-9 w-9" disabled={resetAnalytics.isPending || loading}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Dashboard Statistics?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all chart history, daily analytics data, AND delete ALL orders. User accounts will NOT be deleted. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => resetAnalytics.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {resetAnalytics.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      Reset Analytics
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="h-9 border-slate-200 dark:border-white/10 gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Link to="/admin/products">
                <Button size="sm" className="h-9 bg-[#FF5500] hover:bg-[#E04B00] text-white gap-2 shadow-md shadow-[#FF5500]/20">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Product</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
              ))
            ) : (
              statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  <Link to={card.link} className="block group">
                    <div className="bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/8 rounded-2xl p-5 hover:shadow-lg hover:border-[#FF5500]/30 dark:hover:border-[#FF5500]/20 transition-all duration-300 shadow-sm h-full">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">{card.label}</p>
                        <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shadow-md`}>
                          <card.icon className="w-4.5 h-4.5 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black font-lato text-slate-900 dark:text-white leading-none mb-2">{card.value}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {card.sub1 && <span className="text-xs text-slate-400 dark:text-white/30">{card.sub1}</span>}
                        {card.sub2 && (
                          <>
                            <span className="text-slate-200 dark:text-white/10">·</span>
                            <span className="text-xs text-amber-500 font-medium">{card.sub2}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          {/* Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/8 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-2xl font-black font-lato text-slate-900 dark:text-white">{stats.completedOrders}</h4>
                <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">Completed Orders</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/8 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-2xl font-black font-lato text-slate-900 dark:text-white">{stats.pendingOrders}</h4>
                  <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">Pending Orders</p>
                </div>
              </div>
              {stats.pendingOrders > 0 && (
                <Link to="/admin/orders" className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors">View →</Link>
              )}
            </div>

            <div className={`bg-white dark:bg-[#1A1028] border rounded-2xl p-5 shadow-sm flex items-center justify-between transition-colors ${maintenanceMode ? 'border-amber-400/50 bg-amber-50 dark:bg-amber-500/5' : 'border-slate-200 dark:border-white/8'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${maintenanceMode ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-white/50'}`}>
                  <Hammer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Maintenance</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{maintenanceMode ? 'Site Offline' : 'Site Online'}</p>
                </div>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={(checked) => updateSetting.mutate({ key: 'maintenance_mode', value: checked.toString() })} />
            </div>
          </div>

          {/* Analytics Grid Section */}
          <div className="space-y-4">
            <AnalyticsCharts daysRange={timeRange as any} />
          </div>

          {/* Bottom: Recent Orders + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Recent Orders Table */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/8 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-white/8">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Recent Orders</h3>
                  <p className="text-xs text-slate-400 dark:text-white/40">Latest transaction activity</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      className="pl-8 pr-3 h-8 text-xs rounded-lg bg-slate-100 dark:bg-white/8 border border-transparent focus:border-[#FF5500]/40 focus:outline-none text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 w-36"
                    />
                  </div>
                  <Link to="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-[#FF5500] hover:text-[#E04B00] whitespace-nowrap">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-10 h-10 text-slate-200 dark:text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 dark:text-white/30">No orders yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5">
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 px-5 py-3">Order</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 px-4 py-3">Date</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 px-4 py-3">Provider</th>
                        <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 px-4 py-3">Amount</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/4">
                      {filteredOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group">
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-800 dark:text-white text-xs">#{order.id.slice(0, 8).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-white/40 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-white/40 capitalize">
                            {order.payment_provider || 'Direct'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="font-black text-slate-900 dark:text-white text-sm">{currencySymbol}{Number(order.total_amount).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${getStatusClass(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white px-0.5">Quick Actions</h3>
              {[
                { to: '/admin/products', label: 'Manage Products', sub: 'Add or edit inventory', icon: Package, iconBg: 'bg-[#FF5500]' },
                { to: '/admin/orders', label: 'View Orders', sub: 'Track all transactions', icon: ShoppingCart, iconBg: 'bg-violet-500' },
                { to: '/admin/users', label: 'User Management', sub: 'View and manage users', icon: Users, iconBg: 'bg-blue-500' },
                { to: '/admin/customization', label: 'Site Customization', sub: 'Edit appearance & content', icon: TrendingUp, iconBg: 'bg-emerald-500' },
              ].map((action) => (
                <Link to={action.to} key={action.to} className="group block">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1A1028] border border-slate-200 dark:border-white/8 hover:border-[#FF5500]/40 dark:hover:border-[#FF5500]/30 hover:shadow-md transition-all duration-200 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{action.label}</p>
                      <p className="text-xs text-slate-400 dark:text-white/40 truncate">{action.sub}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-[#FF5500] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </Link>
              ))}

              {/* Maintenance Card */}
              <div className={`p-4 rounded-2xl border transition-colors shadow-sm ${maintenanceMode ? 'border-amber-400/50 bg-amber-50 dark:bg-amber-500/5' : 'bg-white dark:bg-[#1A1028] border-slate-200 dark:border-white/8'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${maintenanceMode ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-400 dark:text-white/40'}`}>
                      <Hammer className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Maintenance</p>
                      <p className="text-xs text-slate-400 dark:text-white/40">{maintenanceMode ? '⚠️ Site Offline' : '✅ Site Online'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={(checked) => updateSetting.mutate({ key: 'maintenance_mode', value: checked.toString() })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;
