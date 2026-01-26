
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getInitialData } from '@/lib/query-client';
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

export function useAnalytics() {
    const { user, isAuthReady } = useAuth();

    return useQuery({
        queryKey: ADMIN_STATS_KEYS.analytics,
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('site_analytics')
                .select('*')
                .order('date', { ascending: true })
                .limit(7);

            if (error) throw error;
            return data as AnalyticsData[];
        },
        initialData: () => getInitialData('site-analytics'),
        staleTime: 1000 * 60 * 30, // 30 minutes
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
            return data as unknown as AdminStatsResponse;
        },
        initialData: () => getInitialData('admin-stats'),
        staleTime: 1000 * 60 * 10, // 10 minutes (keep dashboard data fresh but not noisy)
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: isAuthReady && !!user,
    });
}

export function useAdminActions() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const resetAnalytics = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.rpc('admin_reset_site_analytics');
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_STATS_KEYS.all });
            toast({ title: 'Analytics reset successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Reset failed',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    return { resetAnalytics };
}
