import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  is_active: boolean;
}

const HeroSlides = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: '',
    button_link: '',
    is_active: true,
    display_order: 0,
  });

  const { uploadImage, isUploading } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => setFormData((prev) => ({ ...prev, image_url: url })),
  });

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['hero-slides-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('hero_slides')
          .update({
            title: data.title || null,
            subtitle: data.subtitle || null,
            image_url: data.image_url,
            button_text: data.button_text || null,
            button_link: data.button_link || null,
            is_active: data.is_active,
            display_order: data.display_order,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hero_slides').insert({
          title: data.title || null,
          subtitle: data.subtitle || null,
          image_url: data.image_url,
          button_text: data.button_text || null,
          button_link: data.button_link || null,
          is_active: data.is_active,
          display_order: data.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides-admin'] });
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: editingSlide ? 'Slide updated!' : 'Slide created!' });
    },
    onError: () => {
      toast({ title: 'Error saving slide', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides-admin'] });
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast({ title: 'Slide deleted!' });
    },
    onError: () => {
      toast({ title: 'Error deleting slide', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      button_text: '',
      button_link: '',
      is_active: true,
      display_order: slides.length,
    });
    setEditingSlide(null);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      button_text: slide.button_text || '',
      button_link: slide.button_link || '',
      is_active: slide.is_active,
      display_order: slide.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast({ title: 'Please add an image', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({
      ...formData,
      id: editingSlide?.id,
    });
  };

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Hero Banner Slides"
            description="Manage the homepage hero slider images"
            icon={<ImageIcon className="w-5 h-5" />}
            actions={
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Slide
              </Button>
            }
          />

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full md:h-16" />
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No slides yet. Add your first slide!</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid grid-cols-1 gap-6 md:hidden">
                {slides.map((slide) => (
                  <div key={slide.id} className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={slide.image_url}
                        alt={slide.title || 'Slide'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-md ${slide.is_active ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white'}`}>
                          {slide.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg text-foreground line-clamp-1">{slide.title || 'Untitled Slide'}</h3>
                        {slide.subtitle && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{slide.subtitle}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <GripVertical className="w-3 h-3 mr-1" />
                          Order: {slide.display_order}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(slide)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this slide?')) {
                                deleteMutation.mutate(slide.id);
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
                  <Table className="min-w-[760px]">
                    <TableHeader className={ADMIN_TABLE_HEADER_CLASS}>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slides.map((slide) => (
                        <TableRow key={slide.id}>
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          </TableCell>
                          <TableCell>
                            <img
                              src={slide.image_url}
                              alt={slide.title || 'Slide'}
                              className="w-24 h-14 object-cover rounded-lg"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {slide.title || 'No title'}
                            {slide.subtitle && (
                              <span className="block text-sm text-muted-foreground">{slide.subtitle}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${slide.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                              {slide.is_active ? 'Active' : 'Hidden'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(slide)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Delete this slide?')) {
                                    deleteMutation.mutate(slide.id);
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
              <DialogTitle>{editingSlide ? 'Edit Slide' : 'Add Slide'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Slide Image *</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  onUpload={uploadImage}
                  isUploading={isUploading}
                  aspectRatio="video"
                />
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or enter image URL..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_link">Button Link</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
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

export default HeroSlides;
