import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
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

  const { data: siteSettings = [], isLoading } = useQuery({
    queryKey: ['site-settings-admin'],
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
      queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
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
              Save All Changes
            </Button>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="hero">Hero Section</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="social">Social & Footer</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground">Customize the services page header</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="services_title">Services Page Title</Label>
                    <Input
                      id="services_title"
                      value={settings.services_title || ''}
                      onChange={(e) => updateSetting('services_title', e.target.value)}
                      placeholder="Creative Solutions for Every Need"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="services_description">Services Page Description</Label>
                    <Textarea
                      id="services_description"
                      value={settings.services_description || ''}
                      onChange={(e) => updateSetting('services_description', e.target.value)}
                      rows={3}
                      placeholder="From AI-powered prompts to complete brand identities..."
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
                  <div className="space-y-2">
                    <Label htmlFor="about_title_page">About Page Title</Label>
                    <Input
                      id="about_title_page"
                      value={settings.about_title || ''}
                      onChange={(e) => updateSetting('about_title', e.target.value)}
                      placeholder="Crafting Digital Excellence"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about_description_page">About Page Description</Label>
                    <Textarea
                      id="about_description_page"
                      value={settings.about_description || ''}
                      onChange={(e) => updateSetting('about_description', e.target.value)}
                      rows={4}
                      placeholder="Oflex Creative is a digital design studio..."
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
                    <p className="text-sm text-muted-foreground">Footer text and copyright</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Footer Copyright Text</Label>
                  <Input
                    id="footer_text"
                    value={settings.footer_text || ''}
                    onChange={(e) => updateSetting('footer_text', e.target.value)}
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
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
