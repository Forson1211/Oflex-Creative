
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type Project = Tables<'featured_projects'>;

export const PROJECT_KEYS = {
    all: ['projects'] as const,
    lists: () => [...PROJECT_KEYS.all, 'list'] as const,
    list: (filters: any) => [...PROJECT_KEYS.lists(), filters] as const,
    details: () => [...PROJECT_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PROJECT_KEYS.details(), id] as const,
};

export function useProjects(filters: { category?: string; isFeatured?: boolean } = {}) {
    return useQuery({
        queryKey: PROJECT_KEYS.list(filters),
        queryFn: async () => {
            let query = supabase.from('featured_projects').select('*');

            if (filters.category && filters.category !== 'All') {
                query = query.eq('category', filters.category);
            }

            if (filters.isFeatured !== undefined) {
                query = query.eq('is_featured', filters.isFeatured);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data as Project[];
        },
    });
}

export function useProjectMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createProject = useMutation({
        mutationFn: async (newProject: any) => {
            const { data, error } = await supabase.from('featured_projects').insert([newProject]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            toast({ title: 'Success', description: 'Project created successfully' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updateProject = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { error } = await supabase.from('featured_projects').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(variables.id) });
            toast({ title: 'Success', description: 'Project updated successfully' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const deleteProject = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('featured_projects').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            toast({ title: 'Success', description: 'Project deleted successfully' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { createProject, updateProject, deleteProject };
}
