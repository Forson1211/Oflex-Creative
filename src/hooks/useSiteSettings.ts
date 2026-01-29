import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SiteSetting {
  setting_key: string;
  setting_value: string | null;
}

function hexToHSL(hex: string): string {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useSiteSettings() {
  const { data: siteSettings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;
      return data as SiteSetting[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour cache time
    refetchOnWindowFocus: false,
  });

  const getSetting = useCallback((key: string, defaultValue: string = '') => {
    const settings = Array.isArray(siteSettings) ? siteSettings : [];
    const setting = settings.find((s: SiteSetting) => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  }, [siteSettings]);

  useEffect(() => {
    const primaryColor = getSetting('primary_color', '');
    if (primaryColor && primaryColor.startsWith('#')) {
      const hslValue = hexToHSL(primaryColor);
      document.documentElement.style.setProperty('--primary', hslValue);
      document.documentElement.style.setProperty('--primary-foreground', '0 0% 100%');
      document.documentElement.style.setProperty('--ring', hslValue);
      document.documentElement.style.setProperty('--sidebar-primary', hslValue);
      document.documentElement.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
    }

    // Update favicon
    const logoUrl = getSetting('logo_url', '');
    if (logoUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = logoUrl;
    }
  }, [siteSettings, getSetting]);

  const maintenanceMode = getSetting('maintenance_mode', 'false') === 'true';
  const currencySymbol = getSetting('currency_symbol', '$');

  return {
    siteSettings,
    getSetting,
    isLoading,
    maintenanceMode,
    currencySymbol,
  };
}

export function useSiteSettingsMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: 'Settings updated',
        description: `${variables.key.replace(/_/g, ' ')} successfully updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { updateSetting };
}
