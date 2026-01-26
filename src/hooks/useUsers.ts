
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type Profile = Tables<'profiles'>;

export const USER_KEYS = {
    all: ['users'] as const,
    lists: () => [...USER_KEYS.all, 'list'] as const,
    list: (filters: any) => [...USER_KEYS.lists(), filters] as const,
};

export function useUsers() {
    return useQuery({
        queryKey: USER_KEYS.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Profile[];
        },
    });
}

export function useUserMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const lockUser = useMutation({
        mutationFn: async ({ id, lock, reason }: { id: string; lock: boolean; reason?: string }) => {
            const { error } = await supabase.rpc('admin_lock_user_account', {
                p_user_id: id,
                p_lock: lock,
                p_reason: reason
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            toast({ title: 'Success', description: 'User account status updated' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const forcePasswordReset = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.rpc('admin_force_password_reset', {
                p_user_id: id
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            toast({ title: 'Success', description: 'Password reset forced for user' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { lockUser, forcePasswordReset };
}
