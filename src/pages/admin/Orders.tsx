import { useState } from 'react';
import { useOrders, useOrderMutations, type Order } from '@/hooks/useOrders';
import { Search, Eye, ShoppingCart, Loader2, Trash2, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, Calendar, CreditCard, Box } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const { currencySymbol } = useSiteSettings();

  const { data: orders = [], isLoading: loading } = useOrders();
  const { updateOrderStatus, deleteOrder } = useOrderMutations();
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const handleStatusChange = (newStatus: string) => {
    if (!selectedOrder) return;
    updateOrderStatus.mutate(
      { id: selectedOrder.id, status: newStatus },
      {
        onSuccess: () => {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
          toast({ title: "Order updated", description: `Order status changed to ${newStatus}` });
        },
      }
    );
  };

  const updating = updateOrderStatus.isPending;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
      case 'pending':
        return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock };
      case 'cancelled':
        return { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: Box };
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTabOrders = () => {
    if (activeTab === 'all') return filteredOrders;
    return filteredOrders.filter(o => o.status === activeTab);
  };

  const currentList = getTabOrders();

  // Stats for tabs
  const stats = {
    all: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    completed: filteredOrders.filter(o => o.status === 'completed').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <AdminPageHeader
              title="Orders Management"
              description="Track and process customer orders"
              icon={null}
            />
            {/* Keeping header simple, icons in cards */}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">

            {/* Main Content */}
            <div className="flex-1 space-y-6">

              {/* Controls Bar */}
              <GlassCard className="p-3 flex flex-col sm:flex-row gap-4 justify-between items-center bg-transparent border-0 sticky top-4 z-10 backdrop-blur-md">
                {/* Custom Tabs - Cleaner look no borders */}
                <div className="flex p-1 bg-muted/20 rounded-full w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {['all', 'pending', 'completed', 'cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`
                          flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                          ${activeTab === tab
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}
                        `}
                    >
                      <span className="capitalize">{tab}</span>
                      <span className={`text-[10px] ml-1 opacity-80 font-bold`}>
                        {stats[tab as keyof typeof stats]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search - Integrated look */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ID..."
                    className="pl-9 bg-card/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 hover:bg-card/80 transition-colors rounded-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </GlassCard>

              {/* Orders List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-card/20 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : currentList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                    <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                      <Box className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">No orders found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <AnimatePresence>
                      {currentList.map((order, i) => {
                        const StatusIcon = getStatusConfig(order.status).icon;
                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: i * 0.05 }}
                          >
                            <div className="group relative bg-card/30 hover:bg-card/50 rounded-2xl transition-all duration-300">
                              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                { /* Left: ID & Date */}
                                <div className="flex items-start gap-4">
                                  <div className={`p-3 rounded-2xl ${getStatusConfig(order.status).color} bg-opacity-10 border-0`}>
                                    <StatusIcon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h4 className="font-mono font-semibold text-foreground tracking-tight text-base">#{order.id.slice(0, 8)}</h4>
                                      <Badge variant="secondary" className={`capitalize text-[10px] h-5 px-2 border-0 font-medium ${getStatusConfig(order.status).color} bg-opacity-10`}>
                                        {order.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1.5">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </span>
                                      <span className="w-1 h-1 rounded-full bg-border" />
                                      <span className="flex items-center gap-1.5">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Middle: Items & Total - Removed Vertical Borders */}
                                <div className="flex items-center gap-16 flex-1 md:justify-center">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground font-medium opacity-60">Items</span>
                                    <span className="text-sm font-medium">{order.order_items?.length || 0} Products</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground font-medium opacity-60">Total</span>
                                    <span className="text-lg font-bold text-foreground tracking-tight">{currencySymbol}{Number(order.total_amount).toFixed(2)}</span>
                                  </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="hover:bg-primary/5 hover:text-primary transition-colors h-9 px-4 rounded-full text-muted-foreground">
                                    View Details
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="border-border/20 bg-background/95 backdrop-blur-xl">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => setSelectedOrder(order)}>View Details</DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-border/20" />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setOrderToDelete(order.id)}>
                                        Delete Order
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Expandable Mini Items Preview - Subtle Styling */}
                              <div className="hidden md:flex bg-transparent px-5 pb-4 items-center gap-2 text-xs text-muted-foreground -mt-1 ml-[4.5rem]">
                                <span className="opacity-40 font-medium mr-2 text-[10px] uppercase tracking-wider">Includes</span>
                                <div className="flex gap-2">
                                  {order.order_items?.slice(0, 3).map((item, idx) => (
                                    <span key={idx} className="bg-muted/30 px-2.5 py-1 rounded-full truncate max-w-[200px] text-[11px] text-muted-foreground hover:bg-muted/50 transition-colors cursor-default">
                                      {item.product_title}
                                    </span>
                                  ))}
                                  {(order.order_items?.length || 0) > 3 && (
                                    <span className="text-[10px] opacity-50 px-2 py-1">+{(order.order_items?.length || 0) - 3} more</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-3xl overflow-hidden glass-dialog border-border/50 bg-background/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  Order Details
                  <span className="text-muted-foreground font-mono font-normal text-base">#{selectedOrder?.id.slice(0, 8)}</span>
                </DialogTitle>
              </DialogHeader>

              {selectedOrder && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  {/* Left Column: Order Info */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Items List */}
                    <div className="rounded-xl border border-border/60 overflow-hidden bg-card/40">
                      <div className="bg-muted/30 px-4 py-2 border-b border-border/60 text-xs font-medium text-muted-foreground uppercase tracking-wider flex justify-between">
                        <span>Product</span>
                        <span>Price</span>
                      </div>
                      <div className="divide-y divide-border/60">
                        {selectedOrder.order_items?.map((item) => (
                          <div key={item.id} className="p-4 flex justify-between items-center group hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3">
                              {/* Placeholder for product image if available in future */}
                              <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center">
                                <Box className="w-5 h-5 text-muted-foreground/50" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{item.product_title}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className="font-mono text-sm">{currencySymbol}{Number(item.product_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-muted/30 px-4 py-3 border-t border-border/60 flex justify-between items-center">
                        <span className="font-medium">Total Amount</span>
                        <span className="font-bold text-lg text-primary">{currencySymbol}{Number(selectedOrder.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Actions */}
                  <div className="space-y-6">
                    <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Status</h4>

                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg border flex items-center gap-3 ${getStatusConfig(selectedOrder.status).color}`}>
                          {(() => {
                            const Icon = getStatusConfig(selectedOrder.status).icon;
                            return <Icon className="w-5 h-5" />;
                          })()}
                          <span className="font-semibold capitalize">{selectedOrder.status}</span>
                        </div>

                        <div className="space-y-2 pt-2">
                          <Label className="text-xs">Update Status</Label>
                          <Select
                            defaultValue={selectedOrder.status}
                            onValueChange={handleStatusChange}
                            disabled={updating}
                          >
                            <SelectTrigger className="w-full bg-background/50">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Customer Info</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                          <span>{selectedOrder.payment_provider || 'Manual Payment'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(selectedOrder.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this order? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (orderToDelete) {
                      deleteOrder.mutate(orderToDelete);
                      setOrderToDelete(null);
                      toast({ title: "Order deleted" });
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

// Helper icon
const ShoppingBagIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
);

export default Orders;
