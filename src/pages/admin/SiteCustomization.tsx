import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  Palette,
  Type,
  Layout,
  Save,
  Loader2,
  Image,
  Mail,
  Phone,
  MapPin,
  Share2,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  FileText
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const { uploadImage: uploadLogo, isUploading: isUploadingLogo } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => updateSetting('logo_url', url),
  });

  const { uploadImage: uploadHeroBg, isUploading: isUploadingHeroBg } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => updateSetting('hero_background_url', url),
  });

  const { uploadImage: uploadAboutImg, isUploading: isUploadingAboutImg } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => updateSetting('about_image_url', url),
  });

  const { data: siteSettings = [], isLoading } = useQuery({
    queryKey: ['site-settings-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

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
      const updates = Object.entries(settings).map(([key, value]) => {
        const original = siteSettings.find(s => s.setting_key === key);
        return {
          setting_key: key,
          setting_value: value,
          setting_type: original?.setting_type || 'text',
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('site_settings')
        .upsert(updates, { onConflict: 'setting_key' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      localStorage.removeItem('site_settings');
      toast({ title: 'Settings saved successfully!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Site Customization</h1>
              <p className="text-muted-foreground">Customize your website content and appearance</p>
            </div>
            <Button type="submit" disabled={saveMutation.isPending} className="sm:self-auto self-start">
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save All Changes
            </Button>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="flex w-full justify-start gap-1 overflow-x-auto sm:grid sm:grid-cols-6">
              <TabsTrigger value="general" className="whitespace-nowrap">
                General
              </TabsTrigger>
              <TabsTrigger value="hero" className="whitespace-nowrap">
                Hero Section
              </TabsTrigger>
              <TabsTrigger value="homepage" className="whitespace-nowrap">
                Homepage
              </TabsTrigger>
              <TabsTrigger value="pages" className="whitespace-nowrap">
                Pages
              </TabsTrigger>
              <TabsTrigger value="contact" className="whitespace-nowrap">
                Contact
              </TabsTrigger>
              <TabsTrigger value="social" className="whitespace-nowrap">
                Social & Footer
              </TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </div>

              {/* Logo Upload */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Image className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Site Logo</h2>
                    <p className="text-sm text-muted-foreground">Upload your brand logo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Logo Image</Label>
                    <ImageUpload
                      value={settings.logo_url || ''}
                      onChange={(url) => updateSetting('logo_url', url)}
                      onUpload={uploadLogo}
                      isUploading={isUploadingLogo}
                      aspectRatio="auto"
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Or enter logo URL</Label>
                      <Input
                        id="logo_url"
                        value={settings.logo_url || ''}
                        onChange={(e) => updateSetting('logo_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    {settings.logo_url && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                        <img
                          src={settings.logo_url}
                          alt="Logo preview"
                          className="h-12 w-auto"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                      </div>
                    )}
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
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
              </div>
            </TabsContent>

            {/* Hero Section Tab */}
            <TabsContent value="hero" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Type className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Hero Section</h2>
                    <p className="text-sm text-muted-foreground">Customize the homepage hero banner</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hero_title">Hero Title (Line 1)</Label>
                      <Input
                        id="hero_title"
                        value={settings.hero_title || ''}
                        onChange={(e) => updateSetting('hero_title', e.target.value)}
                        placeholder="Crafting Digital"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero_subtitle">Hero Subtitle (Line 2 - Highlighted)</Label>
                      <Input
                        id="hero_subtitle"
                        value={settings.hero_subtitle || ''}
                        onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                        placeholder="Experiences"
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
                      placeholder="From AI prompts to stunning designs..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor="hero_button1_text">Primary Button Text</Label>
                      <Input
                        id="hero_button1_text"
                        value={settings.hero_button1_text || ''}
                        onChange={(e) => updateSetting('hero_button1_text', e.target.value)}
                        placeholder="View Portfolio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero_button2_text">Secondary Button Text</Label>
                      <Input
                        id="hero_button2_text"
                        value={settings.hero_button2_text || ''}
                        onChange={(e) => updateSetting('hero_button2_text', e.target.value)}
                        placeholder="Visit Store"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor="hero_stat1_label">Stat 1 Label</Label>
                      <Input
                        id="hero_stat1_label"
                        value={settings.hero_stat1_label || ''}
                        onChange={(e) => updateSetting('hero_stat1_label', e.target.value)}
                        placeholder="Digital Products Available"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero_stat2_label">Stat 2 Label</Label>
                      <Input
                        id="hero_stat2_label"
                        value={settings.hero_stat2_label || ''}
                        onChange={(e) => updateSetting('hero_stat2_label', e.target.value)}
                        placeholder="Happy Clients"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero_stat3_label">Stat 3 Label</Label>
                      <Input
                        id="hero_stat3_label"
                        value={settings.hero_stat3_label || ''}
                        onChange={(e) => updateSetting('hero_stat3_label', e.target.value)}
                        placeholder="Completed Projects"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Background Image */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Hero Background</h2>
                    <p className="text-sm text-muted-foreground">Upload a background image for the hero section</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Background Image</Label>
                    <ImageUpload
                      value={settings.hero_background_url || ''}
                      onChange={(url) => updateSetting('hero_background_url', url)}
                      onUpload={uploadHeroBg}
                      isUploading={isUploadingHeroBg}
                      aspectRatio="video"
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hero_background_url">Or enter image URL</Label>
                      <Input
                        id="hero_background_url"
                        value={settings.hero_background_url || ''}
                        onChange={(e) => updateSetting('hero_background_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    {settings.hero_background_url && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                        <img
                          src={settings.hero_background_url}
                          alt="Hero background preview"
                          className="w-full h-24 object-cover rounded-lg"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Homepage Tab */}
            <TabsContent value="homepage" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layout className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Homepage Sections</h2>
                    <p className="text-sm text-muted-foreground">Customize section titles and subtitles on the homepage</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Services Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground">Services Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="home_services_badge">Badge Text</Label>
                        <Input
                          id="home_services_badge"
                          value={settings.home_services_badge || ''}
                          onChange={(e) => updateSetting('home_services_badge', e.target.value)}
                          placeholder="What We Do"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="home_services_title">Section Title</Label>
                        <Input
                          id="home_services_title"
                          value={settings.home_services_title || ''}
                          onChange={(e) => updateSetting('home_services_title', e.target.value)}
                          placeholder="Our Services"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="home_services_description">Section Description</Label>
                        <Textarea
                          id="home_services_description"
                          value={settings.home_services_description || ''}
                          onChange={(e) => updateSetting('home_services_description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground">Portfolio Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="home_portfolio_badge">Badge Text</Label>
                        <Input
                          id="home_portfolio_badge"
                          value={settings.home_portfolio_badge || ''}
                          onChange={(e) => updateSetting('home_portfolio_badge', e.target.value)}
                          placeholder="Our Work"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="home_portfolio_title">Section Title</Label>
                        <Input
                          id="home_portfolio_title"
                          value={settings.home_portfolio_title || ''}
                          onChange={(e) => updateSetting('home_portfolio_title', e.target.value)}
                          placeholder="Featured Projects"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="home_portfolio_description">Section Description</Label>
                        <Textarea
                          id="home_portfolio_description"
                          value={settings.home_portfolio_description || ''}
                          onChange={(e) => updateSetting('home_portfolio_description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Store Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground">Store Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="home_store_badge">Badge Text</Label>
                        <Input
                          id="home_store_badge"
                          value={settings.home_store_badge || ''}
                          onChange={(e) => updateSetting('home_store_badge', e.target.value)}
                          placeholder="Digital Store"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="home_store_title">Section Title</Label>
                        <Input
                          id="home_store_title"
                          value={settings.home_store_title || ''}
                          onChange={(e) => updateSetting('home_store_title', e.target.value)}
                          placeholder="Featured Products"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="home_store_description">Section Description</Label>
                        <Textarea
                          id="home_store_description"
                          value={settings.home_store_description || ''}
                          onChange={(e) => updateSetting('home_store_description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testimonials Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground">Testimonials Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="home_testimonials_badge">Badge Text</Label>
                        <Input
                          id="home_testimonials_badge"
                          value={settings.home_testimonials_badge || ''}
                          onChange={(e) => updateSetting('home_testimonials_badge', e.target.value)}
                          placeholder="Testimonials"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="home_testimonials_title">Section Title</Label>
                        <Input
                          id="home_testimonials_title"
                          value={settings.home_testimonials_title || ''}
                          onChange={(e) => updateSetting('home_testimonials_title', e.target.value)}
                          placeholder="What Clients Say"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="home_testimonials_description">Section Description</Label>
                        <Textarea
                          id="home_testimonials_description"
                          value={settings.home_testimonials_description || ''}
                          onChange={(e) => updateSetting('home_testimonials_description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground">CTA Section (Bottom)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="home_cta_badge">Badge Text</Label>
                        <Input
                          id="home_cta_badge"
                          value={settings.home_cta_badge || ''}
                          onChange={(e) => updateSetting('home_cta_badge', e.target.value)}
                          placeholder="🚀 Let's Build Something Amazing"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="home_cta_title">Section Title</Label>
                        <Input
                          id="home_cta_title"
                          value={settings.home_cta_title || ''}
                          onChange={(e) => updateSetting('home_cta_title', e.target.value)}
                          placeholder="Ready to elevate your brand?"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="home_cta_description">Section Description</Label>
                        <Textarea
                          id="home_cta_description"
                          value={settings.home_cta_description || ''}
                          onChange={(e) => updateSetting('home_cta_description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-6">
              {/* Services Page */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Services Page</h2>
                    <p className="text-sm text-muted-foreground">Customize the services page headers</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="services_badge">Hero Badge</Label>
                      <Input
                        id="services_badge"
                        value={settings.services_badge || ''}
                        onChange={(e) => updateSetting('services_badge', e.target.value)}
                        placeholder="Our Services"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="services_title">Hero Title</Label>
                      <Input
                        id="services_title"
                        value={settings.services_title || ''}
                        onChange={(e) => updateSetting('services_title', e.target.value)}
                        placeholder="Creative Solutions for Every Need"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="services_description">Hero Description</Label>
                    <Textarea
                      id="services_description"
                      value={settings.services_description || ''}
                      onChange={(e) => updateSetting('services_description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor="services_process_badge">Process Badge</Label>
                      <Input
                        id="services_process_badge"
                        value={settings.services_process_badge || ''}
                        onChange={(e) => updateSetting('services_process_badge', e.target.value)}
                        placeholder="Our Process"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="services_process_title">Process Title</Label>
                      <Input
                        id="services_process_title"
                        value={settings.services_process_title || ''}
                        onChange={(e) => updateSetting('services_process_title', e.target.value)}
                        placeholder="How We Work"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="services_process_description">Process Description</Label>
                      <Textarea
                        id="services_process_description"
                        value={settings.services_process_description || ''}
                        onChange={(e) => updateSetting('services_process_description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Page */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Store Page</h2>
                    <p className="text-sm text-muted-foreground">Customize the store page header</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="store_badge">Hero Badge</Label>
                      <Input
                        id="store_badge"
                        value={settings.store_badge || ''}
                        onChange={(e) => updateSetting('store_badge', e.target.value)}
                        placeholder="Creator Store"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_title">Hero Title</Label>
                      <Input
                        id="store_title"
                        value={settings.store_title || ''}
                        onChange={(e) => updateSetting('store_title', e.target.value)}
                        placeholder="Premium Digital Products"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_description">Hero Description</Label>
                    <Textarea
                      id="store_description"
                      value={settings.store_description || ''}
                      onChange={(e) => updateSetting('store_description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Page */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Contact Page</h2>
                    <p className="text-sm text-muted-foreground">Customize the contact page header</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_page_title">Contact Page Title</Label>
                    <Input
                      id="contact_page_title"
                      value={settings.contact_page_title || ''}
                      onChange={(e) => updateSetting('contact_page_title', e.target.value)}
                      placeholder="Get in Touch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_page_description">Contact Page Description</Label>
                    <Textarea
                      id="contact_page_description"
                      value={settings.contact_page_description || ''}
                      onChange={(e) => updateSetting('contact_page_description', e.target.value)}
                      rows={3}
                      placeholder="Have a project in mind? Let's discuss..."
                    />
                  </div>
                </div>
              </div>

              {/* About Page */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">About Page</h2>
                    <p className="text-sm text-muted-foreground">Customize the about page content</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="about_badge">Hero Badge</Label>
                      <Input
                        id="about_badge"
                        value={settings.about_badge || ''}
                        onChange={(e) => updateSetting('about_badge', e.target.value)}
                        placeholder="About Us"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="about_title_page">Hero Title</Label>
                      <Input
                        id="about_title_page"
                        value={settings.about_title || ''}
                        onChange={(e) => updateSetting('about_title', e.target.value)}
                        placeholder="Crafting Digital Excellence"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about_description_page">Hero Description</Label>
                    <Textarea
                      id="about_description_page"
                      value={settings.about_description || ''}
                      onChange={(e) => updateSetting('about_description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="about_story_title">Story Section Title</Label>
                        <Input
                          id="about_story_title"
                          value={settings.about_story_title || ''}
                          onChange={(e) => updateSetting('about_story_title', e.target.value)}
                          placeholder="The Journey So Far"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="about_story">Our Story Content</Label>
                        <Textarea
                          id="about_story"
                          value={settings.about_story || ''}
                          onChange={(e) => updateSetting('about_story', e.target.value)}
                          rows={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="about_years_experience">Years Experience</Label>
                          <Input
                            id="about_years_experience"
                            value={settings.about_years_experience || ''}
                            onChange={(e) => updateSetting('about_years_experience', e.target.value)}
                            placeholder="5+"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="about_projects_completed">Projects Completed</Label>
                          <Input
                            id="about_projects_completed"
                            value={settings.about_projects_completed || ''}
                            onChange={(e) => updateSetting('about_projects_completed', e.target.value)}
                            placeholder="200+"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>About Page Image</Label>
                        <ImageUpload
                          value={settings.about_image_url || ''}
                          onChange={(url) => updateSetting('about_image_url', url)}
                          onUpload={uploadAboutImg}
                          isUploading={isUploadingAboutImg}
                          aspectRatio="video"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Page */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Portfolio Page</h2>
                    <p className="text-sm text-muted-foreground">Customize the portfolio page header</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="portfolio_badge">Hero Badge</Label>
                      <Input
                        id="portfolio_badge"
                        value={settings.portfolio_badge || ''}
                        onChange={(e) => updateSetting('portfolio_badge', e.target.value)}
                        placeholder="Our Work"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolio_title">Hero Title</Label>
                      <Input
                        id="portfolio_title"
                        value={settings.portfolio_title || ''}
                        onChange={(e) => updateSetting('portfolio_title', e.target.value)}
                        placeholder="Our Creative Portfolio"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_description">Hero Description</Label>
                    <Textarea
                      id="portfolio_description"
                      value={settings.portfolio_description || ''}
                      onChange={(e) => updateSetting('portfolio_description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
                    <p className="text-sm text-muted-foreground">Your business contact details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email || ''}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      placeholder="hello@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone_number"
                      value={settings.phone_number || ''}
                      onChange={(e) => updateSetting('phone_number', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address / Location
                    </Label>
                    <Input
                      id="address"
                      value={settings.address || ''}
                      onChange={(e) => updateSetting('address', e.target.value)}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Social & Footer Tab */}
            <TabsContent value="social" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Social Media Links</h2>
                    <p className="text-sm text-muted-foreground">Connect your social profiles</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="social_instagram" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </Label>
                    <Input
                      id="social_instagram"
                      value={settings.social_instagram || ''}
                      onChange={(e) => updateSetting('social_instagram', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_twitter" className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter / X
                    </Label>
                    <Input
                      id="social_twitter"
                      value={settings.social_twitter || ''}
                      onChange={(e) => updateSetting('social_twitter', e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_facebook" className="flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </Label>
                    <Input
                      id="social_facebook"
                      value={settings.social_facebook || ''}
                      onChange={(e) => updateSetting('social_facebook', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_linkedin" className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="social_linkedin"
                      value={settings.social_linkedin || ''}
                      onChange={(e) => updateSetting('social_linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Footer</h2>
                    <p className="text-sm text-muted-foreground">Footer text, copyright and background color</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Footer Copyright Text</Label>
                    <Input
                      id="footer_text"
                      value={settings.footer_text || ''}
                      onChange={(e) => updateSetting('footer_text', e.target.value)}
                      placeholder="© 2024 Your Company. All rights reserved."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer_color">Footer Background Color</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="footer_color"
                        type="color"
                        value={settings.footer_color || '#1a1a1a'}
                        onChange={(e) => updateSetting('footer_color', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={settings.footer_color || ''}
                        onChange={(e) => updateSetting('footer_color', e.target.value)}
                        className="flex-1"
                        placeholder="Leave empty for default theme color"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Leave empty to use the default theme background</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default SiteCustomization;
