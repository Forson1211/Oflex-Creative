import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useAnalytics } from '@/hooks/useAdminStats';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const AnalyticsCharts = ({ daysRange = 'last7' }: { daysRange?: string }) => {
  const { data: rawData = [], isLoading: loading } = useAnalytics(daysRange);

  const data = useMemo(() => {
    return rawData.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }));
  }, [rawData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 bg-card/50 rounded-2xl animate-pulse border border-border/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <GlassCard className="border-dashed border-2 bg-transparent text-center py-12">
        <h3 className="text-lg font-medium text-foreground">No Analytics Data Yet</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Charts will appear here once you have visitor traffic and order history.
        </p>
      </GlassCard>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold mb-2 text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground capitalize">{entry.name}:</span>
              <span className="font-mono font-medium">{entry.value}</span>
              {entry.name === 'revenue' && <span className="text-muted-foreground ml-1">USD</span>}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        <GlassCard hover={false} className="p-0 overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h3 className="font-bold text-lg">Traffic Overview</h3>
            <p className="text-xs text-muted-foreground">Page views vs Unique visitors</p>
          </div>
          <div className="h-72 w-full p-4 pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Area
                  type="monotone"
                  dataKey="page_views"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  strokeWidth={3}
                  name="Page Views"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="unique_visitors"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                  strokeWidth={3}
                  name="Visitors"
                  animationDuration={1500}
                  animationBegin={200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Revenue Chart */}
        <GlassCard hover={false} className="p-0 overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h3 className="font-bold text-lg">Revenue & Orders</h3>
            <p className="text-xs text-muted-foreground">Financial performance over time</p>
          </div>
          <div className="h-72 w-full p-4 pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dx={-10}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dx={10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 8 }} />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="revenue"
                  animationDuration={1500}
                />
                <Bar
                  yAxisId="right"
                  dataKey="orders_count"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  name="orders"
                  animationDuration={1500}
                  animationBegin={200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* New Users Chart - Full Width on Mobile, Half elsewhere */}
        <GlassCard hover={false} className="p-0 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-border/50">
            <h3 className="font-bold text-lg">New User Signups</h3>
            <p className="text-xs text-muted-foreground">User growth monitoring</p>
          </div>
          <div className="h-64 w-full p-4 pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="new_users"
                  stroke="#ec4899"
                  strokeWidth={4}
                  dot={{ fill: '#ec4899', strokeWidth: 4, r: 4 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  name="New Users"
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
