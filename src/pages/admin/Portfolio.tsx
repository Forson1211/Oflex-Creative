import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, FileText, Grid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
}

const AdminPortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: siteSettings = [], isLoading } = useQuery({
    queryKey: ['site-settings-portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  useEffect(() => {
    if (siteSettings.length > 0) {
      const settingsObj: Record<string, string> = {};
      siteSettings.forEach((s) => {
        settingsObj[s.setting_key] = s.setting_value || '';
      });
      setSettings(settingsObj);
    }
  }, [siteSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        // Try to update first
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);
          
        // If no row was updated, insert new
        if (updateError) {
          await supabase.from('site_settings').insert({
            setting_key: update.setting_key,
            setting_value: update.setting_value,
            setting_type: 'text',
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Portfolio settings saved!' });
    },
    onError: () => {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Portfolio Page</h1>
              <p className="text-muted-foreground">Customize portfolio page content and layout</p>
            </div>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList>
              <TabsTrigger value="content">Page Content</TabsTrigger>
              <TabsTrigger value="projects">Manage Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {/* Page Header */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Page Header</h2>
                    <p className="text-sm text-muted-foreground">Customize the portfolio page title and description</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_title">Portfolio Page Title</Label>
                    <Input
                      id="portfolio_title"
                      value={settings.portfolio_title || ''}
                      onChange={(e) => updateSetting('portfolio_title', e.target.value)}
                      placeholder="Our Creative Work"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_description">Portfolio Description</Label>
                    <Textarea
                      id="portfolio_description"
                      value={settings.portfolio_description || ''}
                      onChange={(e) => updateSetting('portfolio_description', e.target.value)}
                      rows={3}
                      placeholder="Explore our diverse portfolio of design projects..."
                    />
                  </div>
                </div>
              </div>

              {/* Layout Settings */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Grid className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Layout Settings</h2>
                    <p className="text-sm text-muted-foreground">Configure how projects are displayed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_badge">Badge Text</Label>
                    <Input
                      id="portfolio_badge"
                      value={settings.portfolio_badge || ''}
                      onChange={(e) => updateSetting('portfolio_badge', e.target.value)}
                      placeholder="Portfolio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_cta_text">CTA Button Text</Label>
                    <Input
                      id="portfolio_cta_text"
                      value={settings.portfolio_cta_text || ''}
                      onChange={(e) => updateSetting('portfolio_cta_text', e.target.value)}
                      placeholder="View Project"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projects">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="text-center py-8">
                  <Grid className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Manage Portfolio Projects</h3>
                  <p className="text-muted-foreground mb-6">
                    Portfolio projects are managed through the Featured Projects page.
                    All featured projects will appear in the portfolio.
                  </p>
                  <Button asChild>
                    <Link to="/admin/featured-projects">
                      Go to Featured Projects
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AdminPortfolio;
