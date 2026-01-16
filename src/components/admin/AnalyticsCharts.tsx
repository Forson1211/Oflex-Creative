import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, Eye, ShoppingCart, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  date: string;
  page_views: number;
  unique_visitors: number;
  orders_count: number;
  revenue: number;
  new_users: number;
}

export const AnalyticsCharts = () => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: analyticsData, error } = await supabase
        .from('site_analytics')
        .select('*')
        .order('date', { ascending: true })
        .limit(7);

      if (!error && analyticsData) {
        setData(analyticsData.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
        })));
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const totalPageViews = data.reduce((sum, d) => sum + d.page_views, 0);
  const totalVisitors = data.reduce((sum, d) => sum + d.unique_visitors, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders_count, 0);
  const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0);
  const totalNewUsers = data.reduce((sum, d) => sum + d.new_users, 0);

  // Calculate trends (compare last day to previous)
  const getTrend = (key: keyof AnalyticsData) => {
    if (data.length < 2) return { value: 0, isPositive: true };
    const current = Number(data[data.length - 1]?.[key] || 0);
    const previous = Number(data[data.length - 2]?.[key] || 0);
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return { value: Math.abs(change).toFixed(1), isPositive: change >= 0 };
  };

  const statCards = [
    {
      title: 'Page Views',
      value: totalPageViews.toLocaleString(),
      trend: getTrend('page_views'),
      icon: Eye,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Unique Visitors',
      value: totalVisitors.toLocaleString(),
      trend: getTrend('unique_visitors'),
      icon: Users,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Orders',
      value: totalOrders.toLocaleString(),
      trend: getTrend('orders_count'),
      icon: ShoppingCart,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: 'Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      trend: getTrend('revenue'),
      icon: DollarSign,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-12 bg-muted rounded mb-4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs ${stat.trend.isPositive ? 'text-chart-3' : 'text-destructive'}`}>
                  {stat.trend.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.trend.value}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title} (7 days)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="page_views" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                    strokeWidth={2}
                    name="Page Views"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="unique_visitors" 
                    stroke="hsl(var(--chart-2))" 
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                    strokeWidth={2}
                    name="Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue & Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--chart-3))" 
                    radius={[4, 4, 0, 0]}
                    name="revenue"
                  />
                  <Bar 
                    dataKey="orders_count" 
                    fill="hsl(var(--chart-4))" 
                    radius={[4, 4, 0, 0]}
                    name="orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Users Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New User Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="new_users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
