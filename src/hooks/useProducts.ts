
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type Product = Tables<'products'>;

export const PRODUCT_KEYS = {
    all: ['products'] as const,
    lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
    list: (filters: Record<string, string | number | boolean | undefined>) => [...PRODUCT_KEYS.lists(), filters] as const,
    details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
};

/**
 * Hook to fetch all products or a filtered subset
 */
export function useProducts(filters: { isActive?: boolean; category?: string; searchTerm?: string; limit?: number } = {}) {
    return useQuery({
        queryKey: PRODUCT_KEYS.list(filters),
        queryFn: async () => {
            let query = supabase.from('products').select('*');

            if (filters.isActive !== undefined) {
                query = query.eq('is_active', filters.isActive);
            }

            if (filters.category && filters.category !== 'All') {
                query = query.eq('category', filters.category);
            }

            query = query.order('created_at', { ascending: false });

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) throw error;

            let result = (data || []) as Product[];
            if (filters.searchTerm) {
                const lowerSearch = filters.searchTerm.toLowerCase();
                result = result.filter(p =>
                    p.title.toLowerCase().includes(lowerSearch) ||
                    p.description?.toLowerCase().includes(lowerSearch)
                );
            }

            // Immediately preload product images into browser memory cache for instant rendering
            if (typeof window !== 'undefined' && result.length > 0) {
                result.forEach(p => {
                    if (p.image_url) {
                        const img = new Image();
                        img.src = p.image_url;
                    }
                });
            }

            return result;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache stale time
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection time
    });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string | undefined) {
    return useQuery({
        queryKey: PRODUCT_KEYS.detail(id || ''),
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Product;
        },
        enabled: !!id,
    });
}

/**
 * Mutations for creating, updating, and deleting products
 */
export function useProductMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createProduct = useMutation({
        mutationFn: async (newProduct: Partial<Product>) => {
            const { data, error } = await supabase.from('products').insert([newProduct as any]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            toast({ title: 'Success', description: 'Product created successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updateProduct = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
            const { error } = await supabase.from('products').update(data as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
            toast({ title: 'Success', description: 'Product updated successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            toast({ title: 'Success', description: 'Product deleted successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { createProduct, updateProduct, deleteProduct };
}
