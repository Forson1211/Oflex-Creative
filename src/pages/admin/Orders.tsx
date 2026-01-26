import { useState } from 'react';
import { useOrders, useOrderMutations, type Order } from '@/hooks/useOrders';
import { Search, Eye, ShoppingCart, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTable, ADMIN_TABLE_HEADER_CLASS } from '@/components/admin/AdminTable';



const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const { data: orders = [], isLoading: loading } = useOrders();
  const { updateOrderStatus } = useOrderMutations();

  const handleStatusChange = (newStatus: string) => {
    if (!selectedOrder) return;
    updateOrderStatus.mutate(
      { id: selectedOrder.id, status: newStatus },
      {
        onSuccess: () => {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        },
      }
    );
  };

  const updating = updateOrderStatus.isPending;


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
            <AdminTable minWidthClassName="min-w-[720px]">
              <thead className={ADMIN_TABLE_HEADER_CLASS}>
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
            </AdminTable>
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
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-3">Manage Order</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">Change Status</Label>
                        <Select
                          defaultValue={selectedOrder.status}
                          onValueChange={handleStatusChange}
                          disabled={updating}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {updating && <Loader2 className="w-5 h-5 animate-spin text-primary mt-5" />}
                    </div>
                  </div>
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
