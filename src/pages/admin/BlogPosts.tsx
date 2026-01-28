import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus, Edit, Trash2, Eye, EyeOff, Star, FileText, Calendar } from 'lucide-react';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    author: string;
    image_url: string | null;
    read_time: string;
    tags: string[];
    is_published: boolean;
    is_featured: boolean;
    views_count: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
}

const CATEGORIES = ['Innovation', 'Tutorial', 'Studio News', 'Guide', 'Marketing', 'Design', 'Technology'];

const BlogPosts = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'Innovation',
        author: 'Admin',
        image_url: '',
        read_time: '5 min',
        tags: '',
        is_published: false,
        is_featured: false,
    });

    // Fetch blog posts
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['admin-blog-posts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blog_posts' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as BlogPost[];
        },
    });

    // Create/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const postData = {
                ...data,
                tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
            };

            if (editingPost) {
                const { error } = await supabase
                    .from('blog_posts' as any)
                    .update(postData as any)
                    .eq('id', editingPost.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('blog_posts' as any)
                    .insert([postData as any]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            toast({ title: editingPost ? 'Blog post updated!' : 'Blog post created!' });
            handleCloseDialog();
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('blog_posts' as any)
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            toast({ title: 'Blog post deleted!' });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Toggle publish mutation
    const togglePublishMutation = useMutation({
        mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
            const { error } = await supabase
                .from('blog_posts' as any)
                .update({ is_published } as any)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            toast({ title: 'Post status updated!' });
        },
    });

    // Toggle featured mutation
    const toggleFeaturedMutation = useMutation({
        mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
            const { error } = await supabase
                .from('blog_posts' as any)
                .update({ is_featured } as any)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            toast({ title: 'Featured status updated!' });
        },
    });

    const handleOpenDialog = (post?: BlogPost) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                category: post.category,
                author: post.author,
                image_url: post.image_url || '',
                read_time: post.read_time,
                tags: post.tags.join(', '),
                is_published: post.is_published,
                is_featured: post.is_featured,
            });
        } else {
            setEditingPost(null);
            setFormData({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                category: 'Innovation',
                author: 'Admin',
                image_url: '',
                read_time: '5 min',
                tags: '',
                is_published: false,
                is_featured: false,
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingPost(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-generate slug from title if not provided
        if (!formData.slug && formData.title) {
            formData.slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }

        saveMutation.mutate(formData);
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ProtectedRoute requireAdmin>
            <AdminLayout>
                <div className="space-y-6">
                    <AdminPageHeader
                        title="Blog Posts"
                        description="Manage your blog content"
                        actions={
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => handleOpenDialog()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Post
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>{editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
                                        <DialogDescription>
                                            {editingPost ? 'Update your blog post details' : 'Add a new blog post to your site'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <Label htmlFor="title">Title *</Label>
                                                <Input
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="slug">Slug (URL)</Label>
                                                <Input
                                                    id="slug"
                                                    value={formData.slug}
                                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                    placeholder="auto-generated-from-title"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="category">Category *</Label>
                                                <select
                                                    id="category"
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                                                    required
                                                >
                                                    {CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <Label htmlFor="author">Author</Label>
                                                <Input
                                                    id="author"
                                                    value={formData.author}
                                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="read_time">Read Time</Label>
                                                <Input
                                                    id="read_time"
                                                    value={formData.read_time}
                                                    onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                                                    placeholder="5 min"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor="image_url">Featured Image URL</Label>
                                                <Input
                                                    id="image_url"
                                                    value={formData.image_url}
                                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor="excerpt">Excerpt *</Label>
                                                <Textarea
                                                    id="excerpt"
                                                    value={formData.excerpt}
                                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                                    rows={3}
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor="content">Content (HTML) *</Label>
                                                <Textarea
                                                    id="content"
                                                    value={formData.content}
                                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                    rows={10}
                                                    required
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                                <Input
                                                    id="tags"
                                                    value={formData.tags}
                                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                    placeholder="AI, Design, Tutorial"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="is_published"
                                                    checked={formData.is_published}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                                                />
                                                <Label htmlFor="is_published">Published</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="is_featured"
                                                    checked={formData.is_featured}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                                                />
                                                <Label htmlFor="is_featured">Featured</Label>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={saveMutation.isPending}>
                                                {saveMutation.isPending ? 'Saving...' : editingPost ? 'Update' : 'Create'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        }
                    />

                    {/* Search */}
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search blog posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">Total Posts</span>
                            </div>
                            <p className="text-2xl font-bold">{posts.length}</p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">Published</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                                {posts.filter(p => p.is_published).length}
                            </p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <EyeOff className="w-4 h-4" />
                                <span className="text-sm">Drafts</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-600">
                                {posts.filter(p => !p.is_published).length}
                            </p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Star className="w-4 h-4" />
                                <span className="text-sm">Featured</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">
                                {posts.filter(p => p.is_featured).length}
                            </p>
                        </div>
                    </div>

                    {/* Mobile View - Cards */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl">
                                <p className="text-muted-foreground">
                                    {searchQuery ? 'No posts found matching your search.' : 'No blog posts yet. Create your first one!'}
                                </p>
                            </div>
                        ) : (
                            filteredPosts.map((post) => (
                                <div key={post.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{post.category}</Badge>
                                                {post.is_featured && <Star className="w-3 h-3 text-primary fill-primary" />}
                                            </div>
                                            <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2">{post.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground border-y border-border py-2 my-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                        <span>•</span>
                                        <span>{post.read_time}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            variant={post.is_published ? 'default' : 'secondary'}
                                            onClick={() => togglePublishMutation.mutate({ id: post.id, is_published: !post.is_published })}
                                        >
                                            {post.is_published ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                                            {post.is_published ? 'Published' : 'Draft'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenDialog(post)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete "{post.title}". This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteMutation.mutate(post.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop View - List */}
                    <div className="hidden md:block bg-card border rounded-lg">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading...</div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchQuery ? 'No posts found matching your search.' : 'No blog posts yet. Create your first one!'}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredPosts.map((post) => (
                                    <div key={post.id} className="p-4 hover:bg-accent/50 transition-colors">
                                        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                                            <div className="flex-1 min-w-0 w-full">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                                                    {post.is_featured && (
                                                        <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                    {post.excerpt}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline">{post.category}</Badge>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(post.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{post.read_time}</span>
                                                    <span>•</span>
                                                    <span>{post.views_count} views</span>
                                                    {post.tags.length > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate max-w-[150px]">{post.tags.join(', ')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 sm:flex-none"
                                                    variant={post.is_published ? 'default' : 'outline'}
                                                    onClick={() => togglePublishMutation.mutate({ id: post.id, is_published: !post.is_published })}
                                                >
                                                    {post.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 sm:flex-none"
                                                    variant={post.is_featured ? 'default' : 'outline'}
                                                    onClick={() => toggleFeaturedMutation.mutate({ id: post.id, is_featured: !post.is_featured })}
                                                >
                                                    <Star className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 sm:flex-none"
                                                    variant="outline"
                                                    onClick={() => handleOpenDialog(post)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="destructive" className="flex-1 sm:flex-none">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete "{post.title}". This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteMutation.mutate(post.id)}
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
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
};

export default BlogPosts;
