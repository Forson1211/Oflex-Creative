
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type Testimonial = Tables<'testimonials'>;

export const TESTIMONIAL_KEYS = {
    all: ['testimonials'] as const,
};

export function useTestimonials() {
    return useQuery({
        queryKey: TESTIMONIAL_KEYS.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Testimonial[];
        },
    });
}

export function useTestimonialMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createTestimonial = useMutation({
        mutationFn: async (newTestimonial: any) => {
            const { data, error } = await supabase.from('testimonials').insert([newTestimonial]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TESTIMONIAL_KEYS.all });
            toast({ title: 'Success', description: 'Testimonial created' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updateTestimonial = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { error } = await supabase.from('testimonials').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TESTIMONIAL_KEYS.all });
            toast({ title: 'Success', description: 'Testimonial updated' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const deleteTestimonial = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('testimonials').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TESTIMONIAL_KEYS.all });
            toast({ title: 'Success', description: 'Testimonial deleted' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { createTestimonial, updateTestimonial, deleteTestimonial };
}
