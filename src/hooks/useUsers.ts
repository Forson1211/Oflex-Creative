
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { getInitialData } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';

export type Profile = Tables<'profiles'>;

export interface UserWithRole extends Profile {
    role: string | null;
}

export const USER_KEYS = {
    all: ['users'] as const,
    lists: () => [...USER_KEYS.all, 'list'] as const,
    list: (filters: any) => [...USER_KEYS.lists(), filters] as const,
    profile: (userId: string) => ['profile', userId] as const,
    security: (userId: string) => ['user-security', userId] as const,
};

export interface UserActivity {
    activity_type: string;
    ip_address: string | null;
    created_at: string;
}

export interface UserSecurityInfo {
    user_id: string;
    email: string;
    full_name: string | null;
    account_locked: boolean;
    locked_reason: string | null;
    locked_at: string | null;
    force_password_reset: boolean;
    last_login_at: string | null;
    last_login_ip: string | null;
    failed_login_attempts: number;
    last_failed_login_at: string | null;
    created_at: string;
    recent_activity: UserActivity[];
}

export function useUserSecurityInfo(userId: string | undefined) {
    const { user: currentUser } = useAuth();

    return useQuery({
        queryKey: USER_KEYS.security(userId || ''),
        queryFn: async () => {
            if (!userId || !currentUser) return null;
            const { data, error } = await supabase.rpc('admin_get_user_security_info', {
                p_user_id: userId
            });
            if (error) throw error;
            return data as unknown as UserSecurityInfo;
        },
        initialData: () => getInitialData(USER_KEYS.security(userId || '')),
        staleTime: 1000 * 60 * 10, // 10 minutes
        enabled: !!userId && !!currentUser,
    });
}

export function useProfile(userId: string | undefined) {
    return useQuery({
        queryKey: USER_KEYS.profile(userId || ''),
        queryFn: async () => {
            if (!userId) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            return data as Profile | null;
        },
        initialData: () => getInitialData(USER_KEYS.profile(userId || '')),
        staleTime: 1000 * 60 * 30, // 30 minutes (profile changes rarely)
        enabled: !!userId,
    });
}

export function useUsers() {
    const { user } = useAuth();
    return useQuery({
        queryKey: USER_KEYS.all,
        queryFn: async () => {
            if (!user) return [];

            // Fetch roles and profiles in parallel or joined
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*');

            if (rolesError) console.error('Error fetching roles:', rolesError);

            return profiles.map((profile) => ({
                ...profile,
                role: roles?.find((r) => r.user_id === profile.user_id)?.role || 'user',
            })) as UserWithRole[];
        },
        initialData: () => getInitialData('users'),
        staleTime: 1000 * 60 * 15, // 15 minutes
        enabled: !!user,
    });
}

export function useUserMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const updateProfile = useMutation({
        mutationFn: async ({ userId, data }: { userId: string, data: Partial<Profile> }) => {
            const { error } = await supabase
                .from('profiles')
                .update(data)
                .eq('user_id', userId);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.profile(variables.userId) });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            toast({ title: 'Success', description: 'Profile updated successfully' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const lockUser = useMutation({
        mutationFn: async ({ id, lock, reason }: { id: string; lock: boolean; reason?: string }) => {
            const { error } = await supabase.rpc('admin_lock_user_account', {
                p_user_id: id,
                p_lock: lock,
                p_reason: reason
            });
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.security(variables.id) });
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
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.security(userId) });
            toast({ title: 'Success', description: 'Password reset forced for user' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { updateProfile, lockUser, forcePasswordReset };
}
