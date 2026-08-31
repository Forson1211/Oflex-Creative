import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ExternalLink, Loader2, Sparkles, LayoutGrid, Layers } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useSiteSettings, useSiteSettingsMutations } from '@/hooks/useSiteSettings';
import {
  HomepageClient,
  DEFAULT_HOMEPAGE_CLIENTS,
  CanvaLogo,
  PinterestLogo,
  PosterMyWallLogo,
} from '@/components/layout/TrustedBySection';

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
  const { getSetting } = useSiteSettings();
  const { updateSetting } = useSiteSettingsMutations();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'homepage' | 'footer'>('homepage');

  // --- HOMEPAGE CLIENTS STATE ---
  const [homepageClients, setHomepageClients] = useState<HomepageClient[]>(DEFAULT_HOMEPAGE_CLIENTS);
  const [homepageTitle, setHomepageTitle] = useState(
    getSetting('homepage_clients_title', 'Trusted by 100+ clients worldwide')
  );
  const [isHomeDialogOpen, setIsHomeDialogOpen] = useState(false);
  const [editingHomeClient, setEditingHomeClient] = useState<HomepageClient | null>(null);
  const [homeFormData, setHomeFormData] = useState<HomepageClient>({
    id: '',
    name: '',
    logo_url: '',
    website_url: '',
    display_order: 0,
    is_active: true,
  });

  // --- FOOTER PARTNERS STATE ---
  const [isFooterDialogOpen, setIsFooterDialogOpen] = useState(false);
  const [editingFooterPartner, setEditingFooterPartner] = useState<TrustedPartner | null>(null);
  const [footerFormData, setFooterFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    display_order: 0,
    is_active: true,
  });

  // Load Homepage Clients from site_settings
  useEffect(() => {
    try {
      const raw = getSetting('homepage_clients');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHomepageClients(parsed);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setHomepageClients(DEFAULT_HOMEPAGE_CLIENTS);
  }, [getSetting]);

  useEffect(() => {
    setHomepageTitle(getSetting('homepage_clients_title', 'Trusted by 100+ clients worldwide'));
  }, [getSetting]);

  // Image Upload for Homepage
  const { uploadImage: uploadHomeImage, isUploading: isHomeUploading } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => setHomeFormData((prev) => ({ ...prev, logo_url: url })),
  });

  // Image Upload for Footer
  const { uploadImage: uploadFooterImage, isUploading: isFooterUploading } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => setFooterFormData((prev) => ({ ...prev, logo_url: url })),
  });

  // Query Footer Partners from DB
  const { data: footerPartners = [], isLoading: isFooterLoading } = useQuery({
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

  // Footer Partner Mutations
  const saveFooterMutation = useMutation({
    mutationFn: async (data: typeof footerFormData) => {
      if (editingFooterPartner) {
        const { error } = await supabase
          .from('trusted_partners')
          .update(data)
          .eq('id', editingFooterPartner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trusted_partners').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-partners'] });
      queryClient.invalidateQueries({ queryKey: ['trusted-partners-public'] });
      toast({ title: editingFooterPartner ? 'Footer platform updated!' : 'Footer platform added!' });
      resetFooterForm();
      setIsFooterDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error saving footer partner', variant: 'destructive' });
    },
  });

  const deleteFooterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trusted_partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-partners'] });
      queryClient.invalidateQueries({ queryKey: ['trusted-partners-public'] });
      toast({ title: 'Footer platform deleted' });
    },
    onError: () => {
      toast({ title: 'Error deleting platform', variant: 'destructive' });
    },
  });

  // --- HOMEPAGE HANDLERS ---
  const saveHomepageClientsList = (updatedList: HomepageClient[]) => {
    setHomepageClients(updatedList);
    updateSetting.mutate({
      key: 'homepage_clients',
      value: JSON.stringify(updatedList),
    });
  };

  const handleSaveHomepageTitle = () => {
    updateSetting.mutate({
      key: 'homepage_clients_title',
      value: homepageTitle,
    });
    toast({ title: 'Homepage title updated!' });
  };

  const handleOpenAddHomeClient = () => {
    setEditingHomeClient(null);
    setHomeFormData({
      id: `client_${Date.now()}`,
      name: '',
      logo_url: '',
      website_url: '',
      display_order: homepageClients.length + 1,
      is_active: true,
    });
    setIsHomeDialogOpen(true);
  };

  const handleEditHomeClient = (client: HomepageClient) => {
    setEditingHomeClient(client);
    setHomeFormData({ ...client });
    setIsHomeDialogOpen(true);
  };

  const handleDeleteHomeClient = (id: string) => {
    if (confirm('Delete this client logo from the homepage?')) {
      const updated = homepageClients.filter((c) => c.id !== id);
      saveHomepageClientsList(updated);
      toast({ title: 'Client logo removed from homepage' });
    }
  };

  const handleHomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeFormData.name.trim() || !homeFormData.logo_url.trim()) {
      toast({ title: 'Name and Logo are required', variant: 'destructive' });
      return;
    }

    let updated: HomepageClient[];
    if (editingHomeClient) {
      updated = homepageClients.map((c) => (c.id === editingHomeClient.id ? homeFormData : c));
    } else {
      updated = [...homepageClients, homeFormData];
    }
    saveHomepageClientsList(updated);
    toast({ title: editingHomeClient ? 'Client updated!' : 'Client added!' });
    setIsHomeDialogOpen(false);
  };

  // --- FOOTER HANDLERS ---
  const resetFooterForm = () => {
    setFooterFormData({
      name: '',
      logo_url: '',
      website_url: '',
      display_order: footerPartners.length + 1,
      is_active: true,
    });
    setEditingFooterPartner(null);
  };

  const handleEditFooterPartner = (partner: TrustedPartner) => {
    setEditingFooterPartner(partner);
    setFooterFormData({
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url || '',
      display_order: partner.display_order || 0,
      is_active: partner.is_active ?? true,
    });
    setIsFooterDialogOpen(true);
  };

  const handleFooterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveFooterMutation.mutate(footerFormData);
  };

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Brand & Platform Logos
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage the Homepage Clients section and Footer Platforms independently
              </p>
            </div>
          </div>

          {/* Navigation Tabs for 2 Distinct Sections */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'homepage' | 'footer')} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/80 rounded-xl">
              <TabsTrigger value="homepage" className="rounded-lg font-bold flex items-center gap-2 text-xs sm:text-sm">
                <LayoutGrid className="w-4 h-4 text-[#FF5500]" />
                Homepage Clients
              </TabsTrigger>
              <TabsTrigger value="footer" className="rounded-lg font-bold flex items-center gap-2 text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-[#FF5500]" />
                Footer Platforms
              </TabsTrigger>
            </TabsList>

            {/* ========================================================================= */}
            {/* TAB 1: HOMEPAGE CLIENTS (Trusted by 100+ clients worldwide) */}
            {/* ========================================================================= */}
            <TabsContent value="homepage" className="space-y-6 mt-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Section Title & Settings</h2>
                    <p className="text-xs text-muted-foreground">Customize the heading for this homepage row</p>
                  </div>
                  <Button onClick={handleOpenAddHomeClient} className="bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client Logo
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Input
                    value={homepageTitle}
                    onChange={(e) => setHomepageTitle(e.target.value)}
                    placeholder="e.g. Trusted by 100+ clients worldwide"
                    className="max-w-md font-medium"
                  />
                  <Button onClick={handleSaveHomepageTitle} variant="outline" className="shrink-0 font-bold">
                    Save Title
                  </Button>
                </div>
              </div>

              {/* Homepage Client Logos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homepageClients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-between hover:shadow-md transition-all relative overflow-hidden group"
                  >
                    {/* Active Status Badge */}
                    <div className="w-full flex items-center justify-between mb-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        client.is_active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {client.is_active ? 'Active' : 'Hidden'}
                      </span>
                      <span className="text-muted-foreground text-[11px]">Order: {client.display_order}</span>
                    </div>

                    {/* Logo Preview */}
                    <div className="w-full h-20 flex items-center justify-center p-2 mb-3 bg-muted/30 rounded-xl">
                      {client.logo_url === 'builtin:canva' ? (
                        <CanvaLogo />
                      ) : client.logo_url === 'builtin:pinterest' ? (
                        <PinterestLogo />
                      ) : client.logo_url === 'builtin:postermywall' ? (
                        <PosterMyWallLogo />
                      ) : (
                        <img
                          src={client.logo_url}
                          alt={client.name}
                          className="max-h-12 max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x40?text=Logo';
                          }}
                        />
                      )}
                    </div>

                    <h3 className="font-bold text-foreground text-sm text-center mb-1">{client.name}</h3>
                    
                    {client.website_url && (
                      <a
                        href={client.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#FF5500] hover:underline flex items-center gap-1 mb-3"
                      >
                        Visit Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/60 w-full justify-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEditHomeClient(client)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteHomeClient(client.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ========================================================================= */}
            {/* TAB 2: FOOTER PLATFORMS (Trusted Platforms in Footer) */}
            {/* ========================================================================= */}
            <TabsContent value="footer" className="space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-xs">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Footer Platforms</h2>
                  <p className="text-xs text-muted-foreground">Manage logos displayed in the footer's "Trusted Platforms" section</p>
                </div>
                <Button onClick={() => { resetFooterForm(); setIsFooterDialogOpen(true); }} className="bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Footer Platform
                </Button>
              </div>

              {isFooterLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
                </div>
              ) : footerPartners.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <p className="text-muted-foreground">No footer platforms added yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {footerPartners.map((partner) => (
                    <div
                      key={partner.id}
                      className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-between hover:shadow-md transition-all relative overflow-hidden group"
                    >
                      <div className="w-full flex items-center justify-between mb-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          partner.is_active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                        }`}>
                          {partner.is_active ? 'Active' : 'Hidden'}
                        </span>
                        <span className="text-muted-foreground text-[11px]">Order: {partner.display_order}</span>
                      </div>

                      <div className="w-full h-20 flex items-center justify-center p-2 mb-3 bg-muted/30 rounded-xl">
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-h-12 max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x40?text=Logo';
                          }}
                        />
                      </div>

                      <h3 className="font-bold text-foreground text-sm text-center mb-1">{partner.name}</h3>
                      {partner.website_url && (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#FF5500] hover:underline flex items-center gap-1 mb-3"
                        >
                          Visit Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-border/60 w-full justify-center">
                        <Button variant="ghost" size="sm" onClick={() => handleEditFooterPartner(partner)}>
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm('Delete this footer platform?')) {
                              deleteFooterMutation.mutate(partner.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* ========================================================================= */}
          {/* DIALOG: HOMEPAGE CLIENT ADD/EDIT */}
          {/* ========================================================================= */}
          <Dialog open={isHomeDialogOpen} onOpenChange={setIsHomeDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingHomeClient ? 'Edit Homepage Client' : 'Add Homepage Client'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleHomeSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="home_name">Client / Brand Name</Label>
                  <Input
                    id="home_name"
                    value={homeFormData.name}
                    onChange={(e) => setHomeFormData({ ...homeFormData, name: e.target.value })}
                    placeholder="e.g., Canva, Pinterest, Google"
                    required
                  />
                </div>

                {/* Preset Built-in Icons Quick Select */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Presets:</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHomeFormData({ ...homeFormData, name: 'Canva', logo_url: 'builtin:canva', website_url: 'https://www.canva.com' })}
                      className="text-xs"
                    >
                      Canva Vector
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHomeFormData({ ...homeFormData, name: 'Pinterest', logo_url: 'builtin:pinterest', website_url: 'https://www.pinterest.com' })}
                      className="text-xs"
                    >
                      Pinterest Vector
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHomeFormData({ ...homeFormData, name: 'PosterMyWall', logo_url: 'builtin:postermywall', website_url: 'https://www.postermywall.com' })}
                      className="text-xs"
                    >
                      PosterMyWall Vector
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Custom Logo</Label>
                  <ImageUpload
                    value={homeFormData.logo_url.startsWith('builtin:') ? '' : homeFormData.logo_url}
                    onChange={(url) => setHomeFormData({ ...homeFormData, logo_url: url })}
                    onUpload={uploadHomeImage}
                    isUploading={isHomeUploading}
                    aspectRatio="auto"
                  />
                  <p className="text-xs text-muted-foreground">Or enter image URL / preset code:</p>
                  <Input
                    type="text"
                    value={homeFormData.logo_url}
                    onChange={(e) => setHomeFormData({ ...homeFormData, logo_url: e.target.value })}
                    placeholder="https://... or builtin:canva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="home_website_url">Website URL (Optional)</Label>
                  <Input
                    id="home_website_url"
                    type="url"
                    value={homeFormData.website_url || ''}
                    onChange={(e) => setHomeFormData({ ...homeFormData, website_url: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="home_display_order">Display Order</Label>
                  <Input
                    id="home_display_order"
                    type="number"
                    value={homeFormData.display_order}
                    onChange={(e) => setHomeFormData({ ...homeFormData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="home_is_active"
                    checked={homeFormData.is_active}
                    onCheckedChange={(checked) => setHomeFormData({ ...homeFormData, is_active: checked })}
                  />
                  <Label htmlFor="home_is_active">Active (visible on homepage)</Label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsHomeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold">
                    {editingHomeClient ? 'Save Changes' : 'Add Client'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* ========================================================================= */}
          {/* DIALOG: FOOTER PLATFORM ADD/EDIT */}
          {/* ========================================================================= */}
          <Dialog open={isFooterDialogOpen} onOpenChange={setIsFooterDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFooterPartner ? 'Edit Footer Platform' : 'Add Footer Platform'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFooterSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="footer_name">Platform Name</Label>
                  <Input
                    id="footer_name"
                    value={footerFormData.name}
                    onChange={(e) => setFooterFormData({ ...footerFormData, name: e.target.value })}
                    placeholder="e.g., Canva, Freepik"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Platform Logo</Label>
                  <ImageUpload
                    value={footerFormData.logo_url}
                    onChange={(url) => setFooterFormData({ ...footerFormData, logo_url: url })}
                    onUpload={uploadFooterImage}
                    isUploading={isFooterUploading}
                    aspectRatio="auto"
                  />
                  <p className="text-xs text-muted-foreground">Or enter logo URL:</p>
                  <Input
                    type="url"
                    value={footerFormData.logo_url}
                    onChange={(e) => setFooterFormData({ ...footerFormData, logo_url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_website_url">Website URL (Optional)</Label>
                  <Input
                    id="footer_website_url"
                    type="url"
                    value={footerFormData.website_url}
                    onChange={(e) => setFooterFormData({ ...footerFormData, website_url: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_display_order">Display Order</Label>
                  <Input
                    id="footer_display_order"
                    type="number"
                    value={footerFormData.display_order}
                    onChange={(e) => setFooterFormData({ ...footerFormData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="footer_is_active"
                    checked={footerFormData.is_active}
                    onCheckedChange={(checked) => setFooterFormData({ ...footerFormData, is_active: checked })}
                  />
                  <Label htmlFor="footer_is_active">Active (visible in footer)</Label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsFooterDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveFooterMutation.isPending} className="bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold">
                    {saveFooterMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingFooterPartner ? 'Update Platform' : 'Create Platform'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default TrustedPartners;
