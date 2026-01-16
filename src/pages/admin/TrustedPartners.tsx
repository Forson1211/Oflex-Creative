import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface TrustedPartner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

const TrustedPartners = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<TrustedPartner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    display_order: 0,
    is_active: true,
  });

  const { uploadImage, isUploading } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => setFormData((prev) => ({ ...prev, logo_url: url })),
  });

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['trusted-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trusted_partners')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as TrustedPartner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingPartner) {
        const { error } = await supabase
          .from('trusted_partners')
          .update(data)
          .eq('id', editingPartner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trusted_partners').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-partners'] });
      toast({ title: editingPartner ? 'Partner updated!' : 'Partner added!' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error saving partner', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trusted_partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-partners'] });
      toast({ title: 'Partner deleted' });
    },
    onError: () => {
      toast({ title: 'Error deleting partner', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      website_url: '',
      display_order: 0,
      is_active: true,
    });
    setEditingPartner(null);
  };

  const handleEdit = (partner: TrustedPartner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url || '',
      display_order: partner.display_order,
      is_active: partner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Trusted Partners</h1>
              <p className="text-muted-foreground">Manage partner logos displayed in the footer</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPartner ? 'Edit Partner' : 'Add New Partner'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Partner Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Canva"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Partner Logo</Label>
                    <ImageUpload
                      value={formData.logo_url}
                      onChange={(url) => setFormData({ ...formData, logo_url: url })}
                      onUpload={uploadImage}
                      isUploading={isUploading}
                      aspectRatio="auto"
                    />
                    <p className="text-xs text-muted-foreground">Or enter logo URL:</p>
                    <Input
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active (visible on site)</Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingPartner ? 'Update' : 'Create'} Partner
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : partners.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground">No partners added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-card border border-border rounded-xl p-6 flex flex-col items-center"
                >
                  <div className="w-24 h-24 flex items-center justify-center mb-4">
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Logo';
                      }}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{partner.name}</h3>
                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 mb-3"
                    >
                      Visit site <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      partner.is_active
                        ? 'bg-chart-3/20 text-chart-3'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {partner.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(partner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this partner?')) {
                          deleteMutation.mutate(partner.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default TrustedPartners;
