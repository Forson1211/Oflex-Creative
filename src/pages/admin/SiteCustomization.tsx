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
import { Palette, Type, Layout, Save, Loader2 } from 'lucide-react';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
}

const SiteCustomization = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: siteSettings = [], isLoading } = useQuery({
    queryKey: ['site-settings'],
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
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Settings saved successfully!' });
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
              <h1 className="text-2xl font-bold text-foreground">Site Customization</h1>
              <p className="text-muted-foreground">Customize your website content and appearance</p>
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

          {/* General Settings */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layout className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
                <p className="text-sm text-muted-foreground">Basic site information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={settings.site_name || ''}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_tagline">Site Tagline</Label>
                <Input
                  id="site_tagline"
                  value={settings.site_tagline || ''}
                  onChange={(e) => updateSetting('site_tagline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => updateSetting('contact_email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Type className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Hero Section</h2>
                <p className="text-sm text-muted-foreground">Customize the homepage hero</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                    id="hero_title"
                    value={settings.hero_title || ''}
                    onChange={(e) => updateSetting('hero_title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_subtitle">Hero Subtitle (Highlighted)</Label>
                  <Input
                    id="hero_subtitle"
                    value={settings.hero_subtitle || ''}
                    onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_description">Hero Description</Label>
                <Textarea
                  id="hero_description"
                  value={settings.hero_description || ''}
                  onChange={(e) => updateSetting('hero_description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground">Colors and visual styling</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={settings.primary_color || '#8B5CF6'}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.primary_color || '#8B5CF6'}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Note: Color changes require a page refresh to take effect across the site.
              </p>
            </div>
          </div>
        </form>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default SiteCustomization;
