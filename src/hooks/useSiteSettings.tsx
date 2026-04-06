import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SiteSetting {
    setting_key: string;
    setting_value: string | null;
}

interface SiteSettingsContextType {
    siteSettings: SiteSetting[] | undefined;
    getSetting: (key: string, defaultValue?: string) => string;
    isLoading: boolean;
    maintenanceMode: boolean;
    currencySymbol: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

function hexToHSL(hex: string): string {
    try {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        if (hex.length !== 6) return '266 4% 20.8%';
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
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
    } catch (e) {
        return '266 4% 20.8%';
    }
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data: siteSettings, isLoading, error } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const { data, error } = await supabase.from('site_settings').select('*');
            if (error) throw error;
            return data as SiteSetting[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour (Realtime will handle updates)
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    if (error) {
        console.error('Failed to load site settings:', error);
    }

    const getSetting = useCallback((key: string, defaultValue: string = '') => {
        const settings = Array.isArray(siteSettings) ? siteSettings : [];
        const setting = settings.find((s: SiteSetting) => s.setting_key === key);
        return setting?.setting_value || defaultValue;
    }, [siteSettings]);

    useEffect(() => {
        const channel = supabase
            .channel('site-settings-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
                if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                    const updatedSetting = payload.new as SiteSetting;
                    queryClient.setQueryData(['site-settings'], (old: SiteSetting[] | undefined) => {
                        const list = old ? [...old] : [];
                        const idx = list.findIndex(s => s.setting_key === updatedSetting.setting_key);
                        if (idx > -1) list[idx] = updatedSetting;
                        else list.push(updatedSetting);
                        return list;
                    });
                } else {
                    queryClient.invalidateQueries({ queryKey: ['site-settings'] });
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    useEffect(() => {
        const primary = getSetting('primary_color');
        if (primary?.startsWith('#')) {
            const hsl = hexToHSL(primary);
            document.documentElement.style.setProperty('--primary', hsl);
            document.documentElement.style.setProperty('--primary-foreground', '0 0% 100%');
            document.documentElement.style.setProperty('--ring', hsl);
        }
        const accent = getSetting('accent_color');
        if (accent?.startsWith('#')) {
            document.documentElement.style.setProperty('--accent', hexToHSL(accent));
        }
        // Meta Tags Management
        const siteTitle = getSetting('site_name', 'Oflex Creative');
        const siteDesc = getSetting('site_tagline', 'Premium Digital Products & Design Services');
        const ogImage = getSetting('og_image_url', '/og-image.png');

        document.title = siteTitle;

        const updateMeta = (selector: string, attr: string, value: string) => {
            let meta: HTMLMetaElement | null = document.querySelector(selector);
            if (!meta) {
                meta = document.createElement('meta');
                if (selector.includes('property')) meta.setAttribute('property', selector.match(/"([^"]+)"/)?.[1] || '');
                else meta.name = selector.match(/"([^"]+)"/)?.[1] || '';
                document.head.appendChild(meta);
            }
            meta.setAttribute(attr, value);
        };

        updateMeta('meta[name="description"]', 'content', siteDesc);
        updateMeta('meta[property="og:title"]', 'content', siteTitle);
        updateMeta('meta[property="og:description"]', 'content', siteDesc);
        updateMeta('meta[property="og:image"]', 'content', ogImage);
        updateMeta('meta[name="twitter:title"]', 'content', siteTitle);
        updateMeta('meta[name="twitter:description"]', 'content', siteDesc);
        updateMeta('meta[name="twitter:image"]', 'content', ogImage);

        const faviconUrl = getSetting('site_favicon_url', '/favicon.png');
        if (faviconUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = faviconUrl;
        }
    }, [siteSettings, getSetting]);

    const value = {
        siteSettings,
        getSetting,
        isLoading: isLoading && !siteSettings,
        maintenanceMode: getSetting('maintenance_mode') === 'true',
        currencySymbol: getSetting('currency_symbol', '$'),
    };

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    const context = useContext(SiteSettingsContext);
    if (context === undefined) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
    }
    return context;
}

export function useSiteSettingsMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: string }) => {
            const { error } = await supabase.from('site_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
            if (error) throw error;
        },
        onSuccess: (_, v) => {
            queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            toast({ title: 'Success', description: `${v.key} updated.` });
        },
        onError: (e: Error) => {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    });
    return { updateSetting };
}
