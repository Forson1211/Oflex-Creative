import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Eye, Trash2, CheckCircle, Clock, Search, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminTable, ADMIN_TABLE_HEADER_CLASS } from '@/components/admin/AdminTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ContactMessages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast({ title: 'Message deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete message', variant: 'destructive' });
    },
  });

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages.filter((msg) => !msg.is_read).length;

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title={
              <span className="inline-flex items-center gap-2">
                Contact Messages
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {unreadCount} unread
                  </Badge>
                )}
              </span>
            }
            description="View and manage contact form submissions"
            icon={<Mail className="w-5 h-5" />}
            actions={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            }
          />

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:max-w-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-4 animate-pulse"
                >
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No messages found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Contact form submissions will appear here'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredMessages.map((message) => (
                  <div key={message.id} className={`bg-card p-4 rounded-xl border border-border shadow-sm ${message.is_read ? '' : 'bg-primary/5'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{message.name}</h3>
                        <p className="text-sm text-muted-foreground">{message.email}</p>
                      </div>
                      <Badge variant={message.is_read ? 'secondary' : 'default'} className="flex-shrink-0">
                        {message.is_read ? 'Read' : 'New'}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium text-sm mb-1">{message.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/30 p-2 rounded">
                        {message.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewMessage(message)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive px-3">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this message from {message.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(message.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block">
                <AdminTable minWidthClassName="min-w-[900px]">
                  <thead className={ADMIN_TABLE_HEADER_CLASS}>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Status</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Name</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Email</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Subject</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Preview</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Received</th>
                      <th className="text-right p-4 font-medium text-foreground whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMessages.map((message) => (
                      <tr
                        key={message.id}
                        className={`border-b border-border last:border-0 ${message.is_read ? '' : 'bg-primary/5'
                          }`}
                      >
                        <td className="p-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            {message.is_read ? (
                              <CheckCircle className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Clock className="w-4 h-4 text-primary" />
                            )}
                            <Badge
                              variant={message.is_read ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {message.is_read ? 'Read' : 'New'}
                            </Badge>
                          </span>
                        </td>
                        <td className="p-4 font-medium text-foreground whitespace-nowrap">
                          {message.name}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {message.email}
                        </td>
                        <td className="p-4 text-foreground whitespace-nowrap">
                          {message.subject}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          <span className="line-clamp-2 max-w-[36rem]">
                            {message.message}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {new Date(message.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewMessage(message)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Message</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this message from{' '}
                                    {message.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(message.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            </>
          )}
        </div>

        {/* View Message Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
              <DialogDescription>
                From {selectedMessage?.name} ({selectedMessage?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-foreground whitespace-pre-wrap">
                  {selectedMessage?.message}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Received:{' '}
                {selectedMessage &&
                  new Date(selectedMessage.created_at).toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (selectedMessage?.email) {
                      window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`;
                    }
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reply via Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default ContactMessages;
