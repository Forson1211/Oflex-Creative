
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type FAQ = Tables<'faqs'>;

export const FAQ_KEYS = {
    all: ['faqs'] as const,
};

export function useFAQs() {
    return useQuery({
        queryKey: FAQ_KEYS.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as FAQ[];
        },
    });
}

export function useFAQMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createFAQ = useMutation({
        mutationFn: async (newFAQ: any) => {
            const { data, error } = await supabase.from('faqs').insert([newFAQ]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
            toast({ title: 'Success', description: 'FAQ created' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updateFAQ = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { error } = await supabase.from('faqs').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
            toast({ title: 'Success', description: 'FAQ updated' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const deleteFAQ = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('faqs').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
            toast({ title: 'Success', description: 'FAQ deleted' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { createFAQ, updateFAQ, deleteFAQ };
}
