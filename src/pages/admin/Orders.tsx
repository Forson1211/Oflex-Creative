import { useEffect, useState } from 'react';
import { Search, Eye, ShoppingCart } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;

interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-chart-3/20 text-chart-3';
      case 'pending':
        return 'bg-chart-1/20 text-chart-1';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Orders"
            description="Manage customer orders"
            icon={<ShoppingCart className="w-5 h-5" />}
          />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>

          {loading ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Order ID</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Date</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Items</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Total</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Status</th>
                      <th className="text-right p-4 font-medium text-foreground whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border last:border-0">
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-foreground">
                            {order.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {order.order_items?.length || 0} items
                        </td>
                        <td className="p-4 font-medium text-foreground whitespace-nowrap">
                          ${Number(order.total_amount).toFixed(2)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-foreground">
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-foreground">
                        ${Number(selectedOrder.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Items</p>
                      <div className="border border-border rounded-lg overflow-hidden">
                        {selectedOrder.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 flex items-center justify-between border-b border-border last:border-0"
                          >
                            <div>
                              <p className="font-medium text-foreground">{item.product_title}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-medium text-foreground">
                              ${Number(item.product_price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Orders;
