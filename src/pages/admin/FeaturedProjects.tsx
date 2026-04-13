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
  project_url: string | null;
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
    project_url: '',
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
            project_url: data.project_url || null,
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
          project_url: data.project_url || null,
          is_featured: data.is_featured,
          display_order: data.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all related project queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['featured-projects-admin'] });
      
      setIsDialogOpen(false);
      resetForm();
      toast({ title: editingProject ? 'Project updated!' : 'Project created!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error saving project', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('featured_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['featured-projects-admin'] });
      toast({ title: 'Project deleted!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting project', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      });
    },
  });

  const getEmbedUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes('canva.com') && url.includes('/design/')) {
      return `${url.split('?')[0]}/view?embed`;
    }
    if (url.includes('postermywall.com') && url.includes('/index.php/d/')) {
      const id = url.split('/d/')[1]?.split('?')[0];
      return id ? `https://www.postermywall.com/index.php/poster/embed/${id}` : null;
    }
    return null;
  };

  const currentEmbedUrl = getEmbedUrl(formData.project_url);

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      image_url: '',
      description: '',
      project_url: '',
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
      image_url: project.image_url || '',
      description: project.description || '',
      project_url: project.project_url || '',
      is_featured: project.is_featured,
      display_order: project.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url) {
      toast({
        title: "Image Required",
        description: "Please upload or provide an image URL for the project.",
        variant: "destructive"
      });
      return;
    }

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
                  <div key={project.id} className="group bg-card border border-border rounded-none overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={project.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80'}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <span className={`px-2 py-1 rounded-none text-[10px] uppercase font-bold shadow-sm backdrop-blur-md ${project.is_featured ? 'bg-[#FF6B35] text-white' : 'bg-black/50 text-white'}`}>
                          {project.is_featured ? 'Featured' : 'Standard'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-none bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                            {project.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-foreground line-clamp-1 uppercase tracking-tight">{project.title}</h3>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center text-[10px] font-medium text-muted-foreground uppercase">
                          <GripVertical className="w-3 h-3 mr-1" />
                          Order: {project.display_order}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="rounded-none h-8 text-[10px] font-bold uppercase" onClick={() => handleEdit(project)}>
                            <Pencil className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-none h-8 px-3"
                            onClick={() => {
                              if (confirm('Delete this project?')) {
                                deleteMutation.mutate(project.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                              className="w-16 h-12 object-cover rounded-none"
                            />
                          </TableCell>
                          <TableCell className="font-bold uppercase tracking-tight">{project.title}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-none bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                              {project.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-none text-[10px] font-black uppercase tracking-widest ${project.is_featured ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                              {project.is_featured ? 'Yes' : 'No'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="rounded-none" onClick={() => handleEdit(project)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-none"
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
            </DialogHeader>
            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
                      <Input
                        id="title"
                        className="rounded-none h-12 focus:ring-1 focus:ring-primary"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Input
                        id="category"
                        className="rounded-none h-12 focus:ring-1 focus:ring-primary"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Branding, UI/UX"
                        required
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Image</Label>
                    <ImageUpload
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      onUpload={uploadImage}
                      isUploading={isUploading}
                      aspectRatio="video"
                    />
                    <div className="mt-2">
                      <Label htmlFor="image_url" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Manual Image URL</Label>
                      <Input
                        id="image_url"
                        className="rounded-none h-10 text-xs"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="project_url" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Project URL / Embed</Label>
                    <Input
                      id="project_url"
                      className="rounded-none h-12 focus:ring-1 focus:ring-primary"
                      value={formData.project_url}
                      onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                      placeholder="https://canva.com/... or https://postermywall.com/..."
                    />
                    <p className="text-[10px] text-muted-foreground px-1 italic">
                        Tip: Link your design for a high-fidelity interactive preview.
                    </p>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                    <Textarea
                      id="description"
                      className="rounded-none min-h-[100px] resize-none focus:ring-1 focus:ring-primary"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                 </div>

                 <div className="flex items-center gap-4 py-2">
                    <Switch
                      id="is_featured"
                      className="data-[state=checked]:bg-[#FF6B35]"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label htmlFor="is_featured" className="text-[11px] font-bold uppercase tracking-wider">Show on homepage gallery</Label>
                 </div>

                 <div className="flex gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-none font-bold uppercase tracking-widest">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 h-12 rounded-none bg-[#FF6B35] hover:bg-[#E85D2A] font-bold uppercase tracking-widest" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Propagating...' : 'Save Project'}
                    </Button>
                 </div>
               </form>

               {/* Live Preview Side */}
               <div className="space-y-6">
                  <div className="p-4 bg-muted/30 border border-border/50 space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Context Preview</h4>
                     
                     <div className="space-y-4">
                        <div className="aspect-video relative bg-muted rounded-none overflow-hidden border border-border/10">
                           {formData.image_url ? (
                              <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground">Image Preview</div>
                           )}
                           <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[8px] font-bold uppercase">Image Preview</div>
                        </div>

                        {currentEmbedUrl && (
                          <div className="aspect-video relative bg-muted rounded-none overflow-hidden border border-border/10">
                              <iframe src={currentEmbedUrl} className="w-full h-full border-0" title="Embed Preview" />
                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[8px] font-bold uppercase">Live Embed Preview</div>
                          </div>
                        )}

                        {!currentEmbedUrl && formData.project_url && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 text-[9px] text-red-600 font-bold uppercase text-center">
                              Not a supported embed format (Canva/PosterMyWall design link required)
                           </div>
                        )}
                     </div>

                     <div className="space-y-2 pt-2">
                        <h5 className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{formData.title || 'Untitled Project'}</h5>
                        <p className="text-[9px] text-muted-foreground line-clamp-3 leading-relaxed">{formData.description || 'No description provided yet.'}</p>
                     </div>
                  </div>

                  <div className="p-4 bg-[#FF6B35]/5 border border-[#FF6B35]/20">
                     <p className="text-[9px] font-bold uppercase text-[#FF6B35] leading-relaxed">
                        Design Tip: Use high-resolution cover images (16:9 ratio) for the best surgical look in the gallery.
                     </p>
                  </div>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default FeaturedProjects;
