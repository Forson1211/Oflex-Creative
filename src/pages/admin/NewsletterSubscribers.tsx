import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
import { Mail, Download, Trash2, UserCheck, UserX, Calendar, Filter } from 'lucide-react';

interface NewsletterSubscriber {
    id: string;
    email: string;
    full_name: string | null;
    is_active: boolean;
    source: string;
    subscribed_at: string;
    unsubscribed_at: string | null;
    created_at: string;
}

const NewsletterSubscribers = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'unsubscribed'>('all');

    // Fetch subscribers
    const { data: subscribers = [], isLoading } = useQuery({
        queryKey: ['admin-newsletter-subscribers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('newsletter_subscribers' as any)
                .select('*')
                .order('subscribed_at', { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as NewsletterSubscriber[];
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('newsletter_subscribers' as any)
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-newsletter-subscribers'] });
            toast({ title: 'Subscriber deleted!' });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Toggle active status mutation
    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const updateData: any = { is_active };
            if (!is_active) {
                updateData.unsubscribed_at = new Date().toISOString();
            } else {
                updateData.unsubscribed_at = null;
            }

            const { error } = await supabase
                .from('newsletter_subscribers' as any)
                .update(updateData)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-newsletter-subscribers'] });
            toast({ title: 'Subscriber status updated!' });
        },
    });

    // Export to CSV
    const handleExportCSV = () => {
        const csvData = filteredSubscribers.map(sub => ({
            Email: sub.email,
            Name: sub.full_name || '',
            Status: sub.is_active ? 'Active' : 'Unsubscribed',
            Source: sub.source,
            'Subscribed At': new Date(sub.subscribed_at).toLocaleDateString(),
            'Unsubscribed At': sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString() : '',
        }));

        const headers = Object.keys(csvData[0] || {});
        const csv = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({ title: 'Exported successfully!' });
    };

    const filteredSubscribers = subscribers.filter(sub => {
        const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sub.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'active' && sub.is_active) ||
            (filterStatus === 'unsubscribed' && !sub.is_active);

        return matchesSearch && matchesFilter;
    });

    const activeCount = subscribers.filter(s => s.is_active).length;
    const unsubscribedCount = subscribers.filter(s => !s.is_active).length;

    return (
        <ProtectedRoute requireAdmin>
            <AdminLayout>
                <div className="space-y-6">
                    <AdminPageHeader
                        title="Newsletter Subscribers"
                        description="Manage your email subscribers"
                        actions={
                            <Button onClick={handleExportCSV} disabled={subscribers.length === 0}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        }
                    />

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">Total Subscribers</span>
                            </div>
                            <p className="text-2xl font-bold">{subscribers.length}</p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <UserCheck className="w-4 h-4" />
                                <span className="text-sm">Active</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <UserX className="w-4 h-4" />
                                <span className="text-sm">Unsubscribed</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-600">{unsubscribedCount}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search by email or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant={filterStatus === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterStatus === 'active' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('active')}
                            >
                                Active
                            </Button>
                            <Button
                                variant={filterStatus === 'unsubscribed' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('unsubscribed')}
                            >
                                Unsubscribed
                            </Button>
                        </div>
                    </div>

                    {/* Subscribers List */}
                    <div className="bg-card border rounded-lg">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading...</div>
                        ) : filteredSubscribers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'No subscribers found matching your filters.'
                                    : 'No newsletter subscribers yet.'}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredSubscribers.map((subscriber) => (
                                    <div key={subscriber.id} className="p-4 hover:bg-accent/50 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="font-medium truncate">{subscriber.email}</span>
                                                    {subscriber.is_active ? (
                                                        <Badge variant="default" className="bg-green-600">Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Unsubscribed</Badge>
                                                    )}
                                                </div>
                                                {subscriber.full_name && (
                                                    <p className="text-sm text-muted-foreground mb-2">{subscriber.full_name}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Subscribed: {new Date(subscriber.subscribed_at).toLocaleDateString()}
                                                    </span>
                                                    {subscriber.unsubscribed_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Unsubscribed: {new Date(subscriber.unsubscribed_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <Badge variant="outline" className="text-xs">
                                                        {subscriber.source}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant={subscriber.is_active ? 'default' : 'outline'}
                                                    onClick={() => toggleActiveMutation.mutate({
                                                        id: subscriber.id,
                                                        is_active: !subscriber.is_active
                                                    })}
                                                    disabled={toggleActiveMutation.isPending}
                                                >
                                                    {subscriber.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="destructive">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Subscriber?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete {subscriber.email} from your newsletter list.
                                                                This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteMutation.mutate(subscriber.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="bg-muted/50 border border-dashed rounded-lg p-6">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Newsletter Management Tips
                        </h3>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Export your subscriber list regularly for backup purposes</li>
                            <li>Respect unsubscribe requests immediately to maintain trust</li>
                            <li>Monitor the source field to understand where subscribers come from</li>
                            <li>Consider segmenting your list based on subscription date or source</li>
                        </ul>
                    </div>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
};

export default NewsletterSubscribers;
