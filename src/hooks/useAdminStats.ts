
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { useAuth } from '@/hooks/useAuth';

export const ADMIN_STATS_KEYS = {
    all: ['admin-stats'] as const,
    analytics: ['site-analytics'] as const,
};

export interface AnalyticsData {
    date: string;
    page_views: number;
    unique_visitors: number;
    orders_count: number;
    revenue: number;
    new_users: number;
}

export type TimeFrame = 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'last3' | 'last6' | 'thisYear' | 'lastYear' | 'allTime';

export function useAnalytics(timeFrame: string = 'last7') {
    const { user, isAuthReady } = useAuth();

    return useQuery({
        queryKey: [...ADMIN_STATS_KEYS.analytics, timeFrame],
        queryFn: async () => {
            if (!user) return [];
            let query = supabase.from('site_analytics').select('*').order('date', { ascending: false });

            const today = new Date();
            let start = new Date();
            let end = new Date();
            
            if (timeFrame === 'last7') {
                start.setDate(today.getDate() - 7);
                query = query.gte('date', start.toISOString().split('T')[0]);
            } else if (timeFrame === 'last30') {
                start.setDate(today.getDate() - 30);
                query = query.gte('date', start.toISOString().split('T')[0]);
            } else if (timeFrame === 'thisMonth') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of month
                query = query.gte('date', start.toISOString().split('T')[0]).lte('date', end.toISOString().split('T')[0]);
            } else if (timeFrame === 'lastMonth') {
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                query = query.gte('date', start.toISOString().split('T')[0]).lte('date', end.toISOString().split('T')[0]);
            } else if (timeFrame === 'last3') {
                start.setMonth(today.getMonth() - 3);
                query = query.gte('date', start.toISOString().split('T')[0]);
            } else if (timeFrame === 'last6') {
                start.setMonth(today.getMonth() - 6);
                query = query.gte('date', start.toISOString().split('T')[0]);
            } else if (timeFrame === 'thisYear') {
                start = new Date(today.getFullYear(), 0, 1);
                query = query.gte('date', start.toISOString().split('T')[0]);
            } else if (timeFrame === 'lastYear') {
                start = new Date(today.getFullYear() - 1, 0, 1);
                end = new Date(today.getFullYear() - 1, 11, 31);
                query = query.gte('date', start.toISOString().split('T')[0]).lte('date', end.toISOString().split('T')[0]);
            }

            // apply a reasonable safety limit if not bounded completely by small dates
            if (['last7', 'last30', 'thisMonth', 'lastMonth'].includes(timeFrame)) {
                query = query.limit(31);
            } else {
                query = query.limit(365);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data as AnalyticsData[]).reverse();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: isAuthReady && !!user,
    });
}

export interface RecentOrder {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    payment_provider: string | null;
}

export interface AdminStatsResponse {
    total_products: number;
    total_orders: number;
    total_revenue: number;
    total_users: number;
    completed_orders: number;
    pending_orders: number;
    recent_orders: RecentOrder[];
}

export function useAdminStats() {
    const { user, isAuthReady } = useAuth();

    return useQuery({
        queryKey: ADMIN_STATS_KEYS.all,
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;

            const stats = data as unknown as AdminStatsResponse;

            if (stats) {
                // Manually get total_orders count excluding archived orders to ensure UI accuracy
                const { count, error: countError } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .neq('status', 'archived');

                if (!countError && count !== null) {
                    stats.total_orders = count;
                }
            }

            return stats;
        },
        staleTime: 1000 * 60, // 1 minute (keep dashboard data fresh but not noisy)
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: isAuthReady && !!user,
    });
}

export function useAdminActions() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const resetAnalytics = useMutation({
        mutationFn: async () => {
            // 1. Reset site analytics table via RPC
            const { error: rpcError } = await supabase.rpc('admin_reset_site_analytics');
            if (rpcError) console.warn('Analytics RPC reset failed:', rpcError.message);

            // 2. Clear order history
            // We use ARCHIVED status as the fallback since hard deletion is restricted by RLS
            // This ensures they disappear from Recent Orders and all filtered views.
            const { error: resetError } = await supabase
                .from('orders')
                .update({ status: 'archived' })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to target all

            if (resetError) {
                console.error('Order reset failed:', resetError.message);
                throw resetError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_STATS_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ADMIN_STATS_KEYS.analytics });
            toast({ title: 'Analytics reset successfully' });
        },
        onError: (error: Error) => {
            toast({
                title: 'Reset failed',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    return { resetAnalytics };
}
