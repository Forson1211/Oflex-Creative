/**
 * Centralized environment configuration
 * Ensures consistent behavior across localhost and production hosts
 */

const getAppUrl = () => {
    // Always prioritize the browser's current origin for redirects and assets
    // This ensures the app works correctly on localhost, IP addresses, and production domains
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('undefined')) {
        return window.location.origin;
    }

    // Fallback for SSR or non-browser environments
    return import.meta.env.VITE_APP_URL || 'http://localhost:3000';
};

export const ENV_CONFIG = {
    APP_URL: getAppUrl(),
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    IS_DEV: import.meta.env.DEV,
    IS_PROD: import.meta.env.PROD,
};

/**
 * Helper to generate absolute URLs for assets/redirects
 */
export const getAbsoluteUrl = (path: string) => {
    const baseUrl = ENV_CONFIG.APP_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};
