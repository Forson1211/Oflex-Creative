import { QueryClient } from '@tanstack/react-query';

// Define which keys should be persisted to localStorage
const PERSISTENT_KEYS = ['site-settings', 'user-profile', 'featured-products', 'featured-projects', 'portfolio-projects', 'store-products', 'hero-slides', 'store-slides', 'testimonials', 'site-stats'];

// Helper to save cache to localStorage
const saveToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
            timestamp: Date.now(),
            data,
        }));
    } catch (error) {
        console.warn('LocalStorage save failed:', error);
    }
};

// Helper to load cache from localStorage
const loadFromStorage = (key: string) => {
    try {
        const item = localStorage.getItem(`cache_${key}`);
        if (!item) return undefined;

        const parsed = JSON.parse(item);
        // Optional: expire cache after 24 hours if strictly needed, 
        // but typically we let React Query handle staleness via staleTime.
        // We return data immediately for "instant load".
        return parsed.data;
    } catch (error) {
        return undefined;
    }
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 1. DATA WILL BE CONSIDERED FRESH FOR 5 MINUTES (No background refetch on hover/focus)
            staleTime: 1000 * 60 * 5,

            // 2. CACHE REMAINS IN MEMORY FOR 24 HOURS
            gcTime: 1000 * 60 * 60 * 24,

            // 3. RETRY FAILURE LOGIC
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
        },
    },
});

// Global subscriber to persist specific queries automatically
queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success') {
        const queryKey = event.query.queryKey;
        const keyString = String(queryKey[0]);

        if (PERSISTENT_KEYS.includes(keyString)) {
            saveToStorage(keyString, event.query.state.data);
        }
    }
});

// Hydration helper for specific hooks can use this, 
// or we can structure our hooks to look here first.
export const getInitialData = (key: string) => {
    return loadFromStorage(key);
};
