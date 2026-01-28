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
  Search,
  Check,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Save,
  Loader2,
  FileText,
  MapPin,
  Share2,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Phone,
  Sparkles,
  Briefcase,
  ShoppingCart,
  MessageSquare,
  Zap,
  Store,
  Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';


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

  const { uploadImage: uploadOgImg, isUploading: isUploadingOgImg } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => updateSetting('site_preview_image_url', url),
  });

  // Refine the useQuery call to remove 'prefetch' and ensure proper typing
  const { data: siteSettings = [], isLoading } = useQuery<SiteSetting[]>({
    queryKey: ['site-settings-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;
      return data as SiteSetting[];
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  // Ensure proper typing for siteSettings in useEffect
  useEffect(() => {
    if (siteSettings.length > 0) {
      const settingsObj: Record<string, string> = {};
      siteSettings.forEach((s) => {
        settingsObj[s.setting_key] = s.setting_value || '';
      });
      setSettings(settingsObj);
    }
  }, [siteSettings]);

  // Ensure proper typing for siteSettings in saveMutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(settings).map(([key, value]) => {
        const original = siteSettings.find((s) => s.setting_key === key);
        return {
          setting_key: key,
          setting_value: value,
          setting_type: original?.setting_type || 'text',
          updated_at: new Date().toISOString(),
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
          <div className="relative mb-12">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Customizer</span>
                  </div>
                  <div className="h-px w-8 bg-border/40" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Design <span className="text-primary">Studio</span>
                </h1>
                <p className="text-muted-foreground text-sm max-w-md font-medium leading-relaxed">
                  Refine your agency's visual identity with precision controls.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="h-10 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 font-bold text-xs uppercase tracking-wider group"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-10">
            <div className="sticky top-16 z-20 -mx-3 sm:-mx-6 lg:-mx-10 px-3 sm:px-6 lg:px-10 py-1.5 bg-background/60 backdrop-blur-xl border-b border-border/5">
              <TabsList className="bg-transparent p-0 flex h-auto w-full gap-1 justify-start overflow-x-auto no-scrollbar rounded-none border-none">
                {[
                  { id: 'general', label: 'General', icon: Layout },
                  { id: 'hero', label: 'Hero', icon: Type },
                  { id: 'homepage', label: 'Home', icon: Globe },
                  { id: 'pages', label: 'Pages', icon: FileText },
                  { id: 'contact', label: 'Contact', icon: MapPin },
                  { id: 'social', label: 'Social', icon: Share2 },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300
                      data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                      data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                      whitespace-nowrap relative
                      after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300
                      data-[state=active]:after:w-[40%]
                    "
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                  <GlassCard className="p-6 sm:p-8 border-primary/10 bg-gradient-to-br from-card/90 to-card/50">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                        <Layout className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Core Identity</h2>
                        <p className="text-sm text-muted-foreground font-medium">Define your brand's basic information</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="site_name" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Site Name</Label>
                        <Input
                          id="site_name"
                          value={settings.site_name || ''}
                          className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
                          onChange={(e) => updateSetting('site_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="site_tagline" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Site Tagline</Label>
                        <Input
                          id="site_tagline"
                          value={settings.site_tagline || ''}
                          className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
                          onChange={(e) => updateSetting('site_tagline', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-8 space-y-3">
                      <Label htmlFor="site_description" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Site Description (SEO)</Label>
                      <Textarea
                        id="site_description"
                        value={settings.site_description || ''}
                        className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl resize-none"
                        onChange={(e) => updateSetting('site_description', e.target.value)}
                        placeholder="Premium Digital Products & Design Services for creative pioneers..."
                        rows={3}
                      />
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6 sm:p-8 border-accent/10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center shadow-inner">
                        <FileText className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Brand Logo</h2>
                        <p className="text-sm text-muted-foreground font-medium">Visual representation of your brand</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Logo Upload</Label>
                        <ImageUpload
                          value={settings.logo_url || ''}
                          onChange={(url) => updateSetting('logo_url', url)}
                          onUpload={uploadLogo}
                          isUploading={isUploadingLogo}
                          aspectRatio="auto"
                          className="rounded-2xl border-dashed border-2 p-2 hover:border-primary/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-6 flex flex-col justify-center">
                        <div className="space-y-3">
                          <Label htmlFor="logo_url" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Direct URL</Label>
                          <Input
                            id="logo_url"
                            value={settings.logo_url || ''}
                            className="bg-background/50 border-border/50 rounded-xl"
                            onChange={(e) => updateSetting('logo_url', e.target.value)}
                            placeholder="https://yourdomain.com/logo.png"
                          />
                        </div>
                        {settings.logo_url && (
                          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center min-h-[100px]">
                            <img
                              src={settings.logo_url}
                              alt="Logo preview"
                              className="max-h-16 w-auto object-contain drop-shadow-sm"
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  <GlassCard className="p-6 sm:p-8 border-primary/10 lg:sticky lg:top-40">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Visual Style</h2>
                        <p className="text-sm text-muted-foreground font-medium">Colors and themes</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <Label htmlFor="primary_color" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Global Primary Color</Label>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/50 rounded-2xl">
                            <Input
                              id="primary_color"
                              type="color"
                              value={settings.primary_color || '#8B5CF6'}
                              onChange={(e) => updateSetting('primary_color', e.target.value)}
                              className="w-14 h-14 p-1 rounded-xl border-none cursor-pointer overflow-hidden"
                            />
                            <div className="flex-1">
                              <Input
                                value={settings.primary_color || '#8B5CF6'}
                                onChange={(e) => updateSetting('primary_color', e.target.value)}
                                className="bg-transparent border-none text-lg font-mono focus-visible:ring-0"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {['#8B5CF6', '#3B82F6', '#EF4444', '#10B981', '#F59E0B'].map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => updateSetting('primary_color', color)}
                                className="w-8 h-8 rounded-full border border-border/50 transition-transform hover:scale-125"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </TabsContent>

            {/* Hero Section Tab */}
            <TabsContent value="hero" className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <GlassCard className="p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-4 mb-8 sm:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent/20 flex items-center justify-center shadow-inner">
                      <Type className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Content Strategy</h2>
                      <p className="text-sm text-muted-foreground font-medium">Headline and messaging control</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="hero_title" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Main Title</Label>
                        <Input
                          id="hero_title"
                          value={settings.hero_title || ''}
                          className="h-12 bg-background/50 rounded-xl"
                          onChange={(e) => updateSetting('hero_title', e.target.value)}
                          placeholder="Crafting Digital"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="hero_subtitle" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Highlight Text</Label>
                        <Input
                          id="hero_subtitle"
                          value={settings.hero_subtitle || ''}
                          className="h-12 bg-background/50 rounded-xl border-primary/30"
                          onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                          placeholder="Experiences"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="hero_description" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Main Description</Label>
                      <Textarea
                        id="hero_description"
                        value={settings.hero_description || ''}
                        onChange={(e) => updateSetting('hero_description', e.target.value)}
                        rows={4}
                        className="bg-background/50 rounded-xl resize-none py-4"
                        placeholder="From AI prompts to stunning designs..."
                      />
                    </div>

                    <div className="pt-8 border-t border-border/50">
                      <Label className="block text-sm font-bold text-foreground mb-6 uppercase tracking-widest text-center underline decoration-primary/30 underline-offset-8">Action Buttons</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="hero_button1_text" className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Primary Text</Label>
                          <Input
                            id="hero_button1_text"
                            value={settings.hero_button1_text || ''}
                            className="bg-background/50 rounded-xl"
                            onChange={(e) => updateSetting('hero_button1_text', e.target.value)}
                            placeholder="View Portfolio"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="hero_button2_text" className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Secondary Text</Label>
                          <Input
                            id="hero_button2_text"
                            value={settings.hero_button2_text || ''}
                            className="bg-background/50 rounded-xl"
                            onChange={(e) => updateSetting('hero_button2_text', e.target.value)}
                            placeholder="Visit Store"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <div className="space-y-6 sm:space-y-8">
                  <GlassCard className="p-6 sm:p-8 border-primary/10">
                    <div className="flex items-center gap-4 mb-6 sm:mb-8">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner text-primary">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Social Proof</h2>
                        <p className="text-sm text-muted-foreground font-medium">Engagement statistics</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map(num => (
                        <div key={num} className="space-y-3">
                          <Label htmlFor={`hero_stat${num}_label`} className="text-xs font-bold text-foreground/70 uppercase tracking-tighter">Stat {num} Label</Label>
                          <Input
                            id={`hero_stat${num}_label`}
                            value={settings[`hero_stat${num}_label`] || ''}
                            className="bg-background/50 rounded-xl"
                            onChange={(e) => updateSetting(`hero_stat${num}_label`, e.target.value)}
                            placeholder={num === 1 ? "Digital Products" : num === 2 ? "Happy Clients" : "Completed Projects"}
                          />
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-6 sm:mb-8">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner text-primary">
                        <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Imagery</h2>
                        <p className="text-sm text-muted-foreground font-medium">Background visuals</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Background Image</Label>
                          <ImageUpload
                            value={settings.hero_background_url || ''}
                            onChange={(url) => updateSetting('hero_background_url', url)}
                            onUpload={uploadHeroBg}
                            isUploading={isUploadingHeroBg}
                            aspectRatio="video"
                            className="rounded-2xl border-dashed border-2 hover:border-primary/50 transition-colors"
                          />
                        </div>
                        <div className="space-y-6 flex flex-col justify-center">
                          <div className="space-y-3">
                            <Label htmlFor="hero_background_url" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Or Direct URL</Label>
                            <Input
                              id="hero_background_url"
                              value={settings.hero_background_url || ''}
                              className="bg-background/50 rounded-xl"
                              onChange={(e) => updateSetting('hero_background_url', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          {settings.hero_background_url && (
                            <div className="relative group rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                              <img
                                src={settings.hero_background_url}
                                alt="Hero preview"
                                className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700"
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                              />
                              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white/70 font-mono truncate">
                                {settings.hero_background_url}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </TabsContent>

            {/* Homepage Tab */}
            <TabsContent value="homepage" className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {[
                  { id: 'services', label: 'Services', icon: Sparkles, color: 'primary' },
                  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, color: 'accent' },
                  { id: 'store', label: 'Store', icon: ShoppingCart, color: 'primary' },
                  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, color: 'accent' },
                  { id: 'cta', label: 'CTA Bottom', icon: Zap, color: 'primary' }
                ].map((section) => (
                  <GlassCard key={section.id} className={cn("p-6 sm:p-8", section.id === 'cta' && "md:col-span-2")}>
                    <div className="flex items-center gap-4 mb-6 sm:mb-8">
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-inner",
                        section.color === 'primary' ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent-foreground"
                      )}>
                        <section.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">{section.label} Section</h2>
                        <p className="text-[10px] sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">Headlines & Tags</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor={`home_${section.id}_badge`} className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Badge Text</Label>
                          <Input
                            id={`home_${section.id}_badge`}
                            value={settings[`home_${section.id}_badge`] || ''}
                            className="bg-background/50 rounded-xl"
                            onChange={(e) => updateSetting(`home_${section.id}_badge`, e.target.value)}
                            placeholder="What We Do"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor={`home_${section.id}_title`} className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Section Title</Label>
                          <Input
                            id={`home_${section.id}_title`}
                            value={settings[`home_${section.id}_title`] || ''}
                            className="bg-background/50 rounded-xl"
                            onChange={(e) => updateSetting(`home_${section.id}_title`, e.target.value)}
                            placeholder="Our Services"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor={`home_${section.id}_description`} className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Section Description</Label>
                        <Textarea
                          id={`home_${section.id}_description`}
                          value={settings[`home_${section.id}_description`] || ''}
                          className="bg-background/50 rounded-xl resize-none"
                          onChange={(e) => updateSetting(`home_${section.id}_description`, e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>

            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Services Page */}
                <GlassCard className="p-6 sm:p-8 border-primary/10">
                  <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner text-primary">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Services Page</h2>
                      <p className="text-sm text-muted-foreground font-medium">Hero and process sections</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="services_badge" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hero Badge</Label>
                        <Input
                          id="services_badge"
                          value={settings.services_badge || ''}
                          className="bg-background/50 rounded-xl"
                          onChange={(e) => updateSetting('services_badge', e.target.value)}
                          placeholder="Our Services"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="services_title" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hero Title</Label>
                        <Input
                          id="services_title"
                          value={settings.services_title || ''}
                          className="bg-background/50 rounded-xl"
                          onChange={(e) => updateSetting('services_title', e.target.value)}
                          placeholder="Creative Solutions"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="services_description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hero Description</Label>
                      <Textarea
                        id="services_description"
                        value={settings.services_description || ''}
                        className="bg-background/50 rounded-xl resize-none"
                        onChange={(e) => updateSetting('services_description', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="pt-6 border-t border-border/50 space-y-4">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 text-center">Work Process Section</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Input
                            id="services_process_badge"
                            value={settings.services_process_badge || ''}
                            className="bg-background/50 rounded-xl text-xs"
                            onChange={(e) => updateSetting('services_process_badge', e.target.value)}
                            placeholder="Process Badge"
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            id="services_process_title"
                            value={settings.services_process_title || ''}
                            className="bg-background/50 rounded-xl font-bold text-xs"
                            onChange={(e) => updateSetting('services_process_title', e.target.value)}
                            placeholder="Process Title"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Textarea
                            id="services_process_description"
                            value={settings.services_process_description || ''}
                            className="bg-background/50 rounded-xl text-xs"
                            onChange={(e) => updateSetting('services_process_description', e.target.value)}
                            placeholder="Describe your process..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* About Page */}
                <GlassCard className="p-6 sm:p-8 border-accent/10">
                  <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent/10 flex items-center justify-center shadow-inner text-accent-foreground">
                      <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">About Page</h2>
                      <p className="text-sm text-muted-foreground font-medium">Your story and achievements</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="about_badge" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hero Badge</Label>
                        <Input
                          id="about_badge"
                          value={settings.about_badge || ''}
                          className="bg-background/50 rounded-xl"
                          onChange={(e) => updateSetting('about_badge', e.target.value)}
                          placeholder="About Us"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="about_title_page" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hero Title</Label>
                        <Input
                          id="about_title_page"
                          value={settings.about_title || ''}
                          className="bg-background/50 rounded-xl"
                          onChange={(e) => updateSetting('about_title', e.target.value)}
                          placeholder="Our Story"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="about_story_title" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Story Title</Label>
                          <Input
                            id="about_story_title"
                            value={settings.about_story_title || ''}
                            className="bg-background/50 rounded-xl font-bold"
                            onChange={(e) => updateSetting('about_story_title', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="about_story" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Our Narrative</Label>
                          <Textarea
                            id="about_story"
                            value={settings.about_story || ''}
                            className="bg-background/50 rounded-xl text-xs leading-relaxed"
                            onChange={(e) => updateSetting('about_story', e.target.value)}
                            rows={8}
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-center block">Years Exp.</Label>
                            <Input
                              value={settings.about_years_experience || ''}
                              className="bg-background/50 rounded-xl text-center font-black"
                              onChange={(e) => updateSetting('about_years_experience', e.target.value)}
                              placeholder="5+"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-center block">Projects</Label>
                            <Input
                              value={settings.about_projects_completed || ''}
                              className="bg-background/50 rounded-xl text-center font-black"
                              onChange={(e) => updateSetting('about_projects_completed', e.target.value)}
                              placeholder="200+"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Page Image</Label>
                          <ImageUpload
                            value={settings.about_image_url || ''}
                            onChange={(url) => updateSetting('about_image_url', url)}
                            onUpload={uploadAboutImg}
                            isUploading={isUploadingAboutImg}
                            aspectRatio="video"
                            className="rounded-xl border-dashed border-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Smaller Page Configs */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-2 sm:mt-4">
                  {[
                    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, color: 'primary' },
                    { id: 'store', label: 'Store', icon: Store, color: 'accent' },
                    { id: 'contact_page', label: 'Contact', icon: Mail, color: 'primary' }
                  ].map(p => (
                    <GlassCard key={p.id} className={cn("p-6 sm:p-8", p.color === 'primary' ? "border-primary/10" : "border-accent/10")}>
                      <div className="flex items-center gap-4 mb-4 sm:mb-6">
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-inner",
                          p.color === 'primary' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"
                        )}>
                          <p.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-foreground">{p.label} Hero</h2>
                      </div>
                      <div className="space-y-4">
                        {p.id !== 'contact_page' && (
                          <Input
                            value={settings[`${p.id}_badge`] || ''}
                            className="bg-background/50 rounded-xl text-xs"
                            onChange={(e) => updateSetting(`${p.id}_badge`, e.target.value)}
                            placeholder="Badge text"
                          />
                        )}
                        <Input
                          value={settings[`${p.id}_title`] || ''}
                          className="bg-background/50 rounded-xl font-bold"
                          onChange={(e) => updateSetting(`${p.id}_title`, e.target.value)}
                          placeholder="Main heading"
                        />
                        <Textarea
                          value={settings[`${p.id}_description`] || ''}
                          className="bg-background/50 rounded-xl text-xs"
                          onChange={(e) => updateSetting(`${p.id}_description`, e.target.value)}
                          placeholder="Description text..."
                          rows={4}
                        />
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <GlassCard className="md:col-span-2 p-6 sm:p-8 lg:p-10 border-primary/10">
                  <div className="flex items-center gap-4 mb-8 sm:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner text-primary">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Business Presence</h2>
                      <p className="text-sm text-muted-foreground font-medium">Where your clients can find you</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="contact_email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        Official Email
                      </Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={settings.contact_email || ''}
                        className="bg-background/50 rounded-xl h-12"
                        onChange={(e) => updateSetting('contact_email', e.target.value)}
                        placeholder="hello@oflex.com"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="phone_number" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        Business Phone
                      </Label>
                      <Input
                        id="phone_number"
                        value={settings.phone_number || ''}
                        className="bg-background/50 rounded-xl h-12"
                        onChange={(e) => updateSetting('phone_number', e.target.value)}
                        placeholder="+233 ..."
                      />
                    </div>
                    <div className="space-y-3 sm:col-span-2">
                      <Label htmlFor="address" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Physical Address
                      </Label>
                      <Input
                        id="address"
                        value={settings.address || ''}
                        className="bg-background/50 rounded-xl h-12"
                        onChange={(e) => updateSetting('address', e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </GlassCard>

                <div className="space-y-6 sm:space-y-8">
                  <GlassCard className="p-6 sm:p-8 border-accent/10 flex flex-col items-center text-center justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 shadow-2xl shadow-primary/20">
                      <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Real-time Sync</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All changes here reflect instantly on your live storefront and landing pages.
                    </p>
                  </GlassCard>
                </div>
              </div>
            </TabsContent>

            {/* Social & Footer Tab */}
            <TabsContent value="social" className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <GlassCard className="lg:col-span-2 p-6 sm:p-8 lg:p-10 border-accent/10">
                  <div className="flex items-center gap-4 mb-8 sm:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent/20 flex items-center justify-center shadow-inner text-accent-foreground">
                      <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Social Connectivity</h2>
                      <p className="text-sm text-muted-foreground font-medium">Engage with your audience on social platforms</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                      { id: 'instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
                      { id: 'twitter', icon: Twitter, placeholder: 'https://twitter.com/...' },
                      { id: 'facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
                      { id: 'linkedin', icon: Linkedin, placeholder: 'https://linkedin.com/...' }
                    ].map(social => (
                      <div key={social.id} className="space-y-3">
                        <Label htmlFor={`social_${social.id}`} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <social.icon className="w-4 h-4" />
                          {social.id}
                        </Label>
                        <Input
                          id={`social_${social.id}`}
                          value={settings[`social_${social.id}`] || ''}
                          className="bg-background/50 rounded-xl h-12"
                          onChange={(e) => updateSetting(`social_${social.id}`, e.target.value)}
                          placeholder={social.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-10 border-t border-border/50">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner text-primary">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Social Preview</h2>
                        <p className="text-sm text-muted-foreground font-medium">This image appears when you share your site URL</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Preview Image (OG Image)</Label>
                        <ImageUpload
                          value={settings.site_preview_image_url || ''}
                          onChange={(url) => updateSetting('site_preview_image_url', url)}
                          onUpload={uploadOgImg}
                          isUploading={isUploadingOgImg}
                          aspectRatio="video"
                          className="rounded-2xl border-dashed border-2 p-2 hover:border-primary/50 transition-colors"
                        />
                        <p className="text-[10px] text-muted-foreground">Recommended size: 1200x630 pixels</p>
                      </div>
                      <div className="space-y-6 flex flex-col justify-center">
                        <div className="space-y-3">
                          <Label htmlFor="site_preview_image_url" className="text-sm font-semibold text-foreground/80 uppercase tracking-tighter">Direct URL</Label>
                          <Input
                            id="site_preview_image_url"
                            value={settings.site_preview_image_url || ''}
                            className="bg-background/50 border-border/50 rounded-xl"
                            onChange={(e) => updateSetting('site_preview_image_url', e.target.value)}
                            placeholder="https://yourdomain.com/preview.png"
                          />
                        </div>
                        {settings.site_preview_image_url && (
                          <div className="relative group rounded-2xl overflow-hidden border border-border/10 shadow-lg aspect-video bg-muted/20">
                            <img
                              src={settings.site_preview_image_url}
                              alt="OG Preview"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8 lg:p-10 border-primary/10">
                  <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner text-primary">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Footer</h2>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="footer_text" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Copyright Text</Label>
                      <Input
                        id="footer_text"
                        value={settings.footer_text || ''}
                        className="bg-background/50 rounded-xl"
                        onChange={(e) => updateSetting('footer_text', e.target.value)}
                        placeholder="© 2024 ..."
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="footer_color" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Footer Background</Label>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                          <Input
                            id="footer_color"
                            type="color"
                            value={settings.footer_color || '#1a1a1a'}
                            onChange={(e) => updateSetting('footer_color', e.target.value)}
                            className="w-10 h-10 p-1 rounded-lg border-none cursor-pointer"
                          />
                          <Input
                            value={settings.footer_color || ''}
                            onChange={(e) => updateSetting('footer_color', e.target.value)}
                            className="bg-transparent border-none text-sm font-mono focus-visible:ring-0"
                            placeholder="Hex Code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        </form >
      </AdminLayout >
    </ProtectedRoute >
  );
};

export default SiteCustomization;
