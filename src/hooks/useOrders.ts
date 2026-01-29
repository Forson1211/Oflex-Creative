
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

import { useAuth } from '@/hooks/useAuth';

export type OrderItem = Tables<'order_items'> & {
    product?: Tables<'products'> | null;
};

export type Order = Tables<'orders'> & {
    order_items: OrderItem[];
};

export const ORDER_KEYS = {
    all: ['orders'] as const,
    lists: () => [...ORDER_KEYS.all, 'list'] as const,
    list: (filters: Record<string, string | number | boolean | null>) => [...ORDER_KEYS.lists(), filters] as const,
    details: () => [...ORDER_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ORDER_KEYS.details(), id] as const,
};

export function useOrders(filters: { status?: string; userId?: string } = {}) {
    const { user, isAuthReady } = useAuth();
    const queryKey = ORDER_KEYS.list(filters);

    return useQuery({
        queryKey,
        queryFn: async () => {
            if (!user) return [];
            let query = supabase.from('orders').select(`
        *,
        order_items:order_items(
          *,
          product:products(*)
        )
      `)
                .neq('status', 'archived');

            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []) as Order[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: isAuthReady && !!user,
    });
}

export function useOrder(id: string | undefined) {
    const { isAuthReady } = useAuth();

    return useQuery({
        queryKey: ORDER_KEYS.detail(id || ''),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items:order_items(
            *,
            product:products(*)
          )
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Order;
        },
        enabled: isAuthReady && !!id,
    });
}

export function useOrderMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const updateOrderStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', id);
            if (updateError) throw updateError;

            // If marking as completed, verify logic to grant access (create purchase records)
            if (status === 'completed') {
                // Fetch order details to get items and user_id
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select(`
                        user_id,
                        order_items (
                            product_id,
                            product_title
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (orderError || !order) {
                    console.error("Error fetching order details:", orderError);
                    throw new Error("Order updated but failed to retrieve details for product access.");
                }

                // Check for existing purchases to prevent duplicates
                const { count } = await supabase
                    .from('purchases')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', id);

                if (count && count > 0) {
                    return; // Access already granted
                }

                // Fetch product details for links
                const productIds = order.order_items.map((i: any) => i.product_id).filter(Boolean);

                if (productIds.length > 0) {
                    const { data: products } = await supabase
                        .from('products')
                        .select('id, template_link, file_url')
                        .in('id', productIds);

                    const productMap = new Map((products || []).map((p: any) => [p.id, p]));

                    const purchaseRecords = order.order_items.map((item: any) => {
                        const product = productMap.get(item.product_id);
                        return {
                            user_id: order.user_id,
                            order_id: id, // Explicitly link to the order
                            product_id: item.product_id,
                            product_title: item.product_title,
                            template_link: product?.template_link || null,
                            file_url: product?.file_url || null
                        };
                    });

                    if (purchaseRecords.length > 0) {
                        const { error: purchaseError } = await supabase.from('purchases').insert(purchaseRecords);
                        if (purchaseError) {
                            console.error("Error creating purchase records:", purchaseError);
                            throw new Error("Order updated but failed to grant product access.");
                        }
                    }
                }
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ['purchases'] }); // Force refresh users' purchase list
            toast({ title: 'Success', description: 'Order status updated' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const deleteOrder = useMutation({
        mutationFn: async (id: string) => {
            // Attempt to delete
            const { data, error } = await supabase.from('orders').delete().eq('id', id).select();

            if (error) throw error;

            // Check if delete was successful (affected rows > 0)
            if (!data || data.length === 0) {
                // If delete failed (likely RLS), move to "archived" status
                // Archived orders are filtered out globally in useOrders query
                const { error: archiveError } = await supabase
                    .from('orders')
                    .update({ status: 'archived' })
                    .eq('id', id);

                if (archiveError) {
                    throw new Error("Could not delete order. Permission denied.");
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
            toast({ title: 'Success', description: 'Order deleted successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const cancelOrder = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast({ title: 'Success', description: 'Order cancelled successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return { updateOrderStatus, deleteOrder, cancelOrder };
}
