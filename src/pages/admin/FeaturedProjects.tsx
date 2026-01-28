import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { AdminTableContainer, ADMIN_TABLE_HEADER_CLASS } from '@/components/admin/AdminTable';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface FeaturedProject {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  is_featured: boolean;
  display_order: number;
}

const FeaturedProjects = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FeaturedProject | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    image_url: '',
    description: '',
    is_featured: true,
    display_order: 0,
  });

  const { uploadImage, isUploading } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => setFormData((prev) => ({ ...prev, image_url: url })),
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['featured-projects-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_projects')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as FeaturedProject[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('featured_projects')
          .update({
            title: data.title,
            category: data.category,
            image_url: data.image_url,
            description: data.description || null,
            is_featured: data.is_featured,
            display_order: data.display_order,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('featured_projects').insert({
          title: data.title,
          category: data.category,
          image_url: data.image_url,
          description: data.description || null,
          is_featured: data.is_featured,
          display_order: data.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-projects-admin'] });
      queryClient.invalidateQueries({ queryKey: ['featured-projects'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: editingProject ? 'Project updated!' : 'Project created!' });
    },
    onError: () => {
      toast({ title: 'Error saving project', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('featured_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-projects-admin'] });
      queryClient.invalidateQueries({ queryKey: ['featured-projects'] });
      toast({ title: 'Project deleted!' });
    },
    onError: () => {
      toast({ title: 'Error deleting project', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      image_url: '',
      description: '',
      is_featured: true,
      display_order: projects.length,
    });
    setEditingProject(null);
  };

  const handleEdit = (project: FeaturedProject) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      category: project.category,
      image_url: project.image_url,
      description: project.description || '',
      is_featured: project.is_featured,
      display_order: project.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      id: editingProject?.id,
    });
  };

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Featured Projects"
            description="Manage portfolio projects shown on homepage"
            icon={<ImageIcon className="w-5 h-5" />}
            actions={
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            }
          />

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full md:h-16" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No projects yet. Add your first project!</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid grid-cols-1 gap-6 md:hidden">
                {projects.map((project) => (
                  <div key={project.id} className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={project.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80'}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-md ${project.is_featured ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white'}`}>
                          {project.is_featured ? 'Featured' : 'Standard'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {project.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg text-foreground line-clamp-1">{project.title}</h3>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <GripVertical className="w-3 h-3 mr-1" />
                          Order: {project.display_order}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this project?')) {
                                deleteMutation.mutate(project.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block">
                <AdminTableContainer>
                  <Table className="min-w-[820px]">
                    <TableHeader className={ADMIN_TABLE_HEADER_CLASS}>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          </TableCell>
                          <TableCell>
                            <img
                              src={project.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80'}
                              alt={project.title}
                              className="w-16 h-12 object-cover rounded-lg"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              {project.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${project.is_featured ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                              {project.is_featured ? 'Yes' : 'No'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Delete this project?')) {
                                    deleteMutation.mutate(project.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AdminTableContainer>
              </div>
            </>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Branding, UI/UX, Web"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Project Image</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  onUpload={uploadImage}
                  isUploading={isUploading}
                  aspectRatio="video"
                />
                <p className="text-xs text-muted-foreground">Or enter URL directly:</p>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Show on homepage</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default FeaturedProjects;
