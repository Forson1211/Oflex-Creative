
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ADMIN_STATS_KEYS = {
    all: ['admin-stats'] as const,
};

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
    return useQuery({
        queryKey: ADMIN_STATS_KEYS.all,
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;
            return data as unknown as AdminStatsResponse;
        },
        refetchInterval: 1000 * 60, // Refresh every minute
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
