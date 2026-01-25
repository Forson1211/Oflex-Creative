import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type RealtimeOrderPayload = {
  id: string;
  total_amount: number;
  created_at?: string;
  status?: string;
};

type UseRealtimeOrdersOptions = {
  enabled?: boolean;
  onNewOrder?: (order: RealtimeOrderPayload) => void;
  onOrderUpdated?: (order: Partial<RealtimeOrderPayload> & { id: string }) => void;
};

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { enabled = true, onNewOrder, onOrderUpdated } = options;

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
          queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
          
          // Show notification
          const order = payload.new as RealtimeOrderPayload;

          onNewOrder?.(order);

          toast({
            title: 'New order received',
            description: `Order #${order.id.slice(0, 8)} • $${Number(order.total_amount).toFixed(2)}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
          queryClient.invalidateQueries({ queryKey: ['recent-orders'] });

          const order = payload.new as RealtimeOrderPayload;
          onOrderUpdated?.({ id: order.id, status: order.status, total_amount: order.total_amount });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onNewOrder, onOrderUpdated, queryClient, toast]);
}
