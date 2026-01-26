
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type Service = Tables<'services'>;

export const SERVICE_KEYS = {
    all: ['services'] as const,
};

export function useServices() {
    return useQuery({
        queryKey: SERVICE_KEYS.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as Service[];
        },
    });
}

export function useServiceMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createService = useMutation({
        mutationFn: async (newService: any) => {
            const { data, error } = await supabase.from('services').insert([newService]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.all });
            toast({ title: 'Success', description: 'Service created' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updateService = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { error } = await supabase.from('services').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.all });
            toast({ title: 'Success', description: 'Service updated' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const deleteService = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.all });
            toast({ title: 'Success', description: 'Service deleted' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { createService, updateService, deleteService };
}
