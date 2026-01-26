
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getInitialData } from '@/lib/query-client';

export interface Purchase {
    id: string;
    user_id: string;
    product_id: string;
    product_title: string;
    template_link: string | null;
    purchased_at: string;
}

export const PURCHASE_KEYS = {
    all: ['purchases'] as const,
    user: (userId: string) => [...PURCHASE_KEYS.all, userId] as const,
};

export function usePurchases() {
    const { user } = useAuth();

    return useQuery({
        queryKey: PURCHASE_KEYS.user(user?.id || ''),
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('purchases')
                .select('*')
                .eq('user_id', user.id)
                .order('purchased_at', { ascending: false });

            if (error) throw error;
            return data as Purchase[];
        },
        initialData: () => getInitialData(PURCHASE_KEYS.user(user?.id || '')),
        staleTime: 1000 * 60 * 60, // 1 hour (purchases don't change often)
        enabled: !!user,
    });
}

export function usePurchaseMutations() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();

    const deletePurchase = useMutation({
        mutationFn: async (purchaseId: string) => {
            if (!user) throw new Error('Not authenticated');
            const { error } = await supabase
                .from('purchases')
                .delete()
                .eq('id', purchaseId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PURCHASE_KEYS.all });
            toast({ title: 'Success', description: 'Purchase removed from your account' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { deletePurchase };
}
