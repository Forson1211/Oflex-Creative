import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSetting {
  setting_key: string;
  setting_value: string | null;
}

// Convert hex color to HSL values (h s l without 'hsl()' wrapper)
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex to RGB
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Return as "h s% l%" format for CSS variables
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useSiteSettings() {
  const { data: siteSettings = [], isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');
      if (error) throw error;
      return data as SiteSetting[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getSetting = (key: string, defaultValue: string = '') => {
    const setting = siteSettings.find((s) => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  };

  // Apply primary color to CSS variables
  useEffect(() => {
    const primaryColor = getSetting('primary_color', '');
    if (primaryColor && primaryColor.startsWith('#')) {
      const hslValue = hexToHSL(primaryColor);
      document.documentElement.style.setProperty('--primary', hslValue);
      
      // Also update dark mode primary (slightly lighter)
      const r = parseInt(primaryColor.slice(1, 3), 16);
      const g = parseInt(primaryColor.slice(3, 5), 16);
      const b = parseInt(primaryColor.slice(5, 7), 16);
      const lighterHex = `#${Math.min(255, r + 30).toString(16).padStart(2, '0')}${Math.min(255, g + 30).toString(16).padStart(2, '0')}${Math.min(255, b + 30).toString(16).padStart(2, '0')}`;
      const darkHsl = hexToHSL(lighterHex);
      
      // Apply to ring and other primary-related variables
      document.documentElement.style.setProperty('--ring', hslValue);
      document.documentElement.style.setProperty('--sidebar-primary', hslValue);
    }
  }, [siteSettings]);

  return {
    siteSettings,
    getSetting,
    isLoading,
  };
}
