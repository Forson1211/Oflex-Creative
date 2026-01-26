import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Global QueryClient instance with optimized defaults for performance:
 * - staleTime: 5 minutes (data stays fresh, no redundant background refetches)
 * - gcTime: 24 hours (cache stays in memory until purged)
 * - retry: 1 (limit retries to prevent cascading failures)
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 60 * 24,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
        },
    },
});

/**
 * Configure persistence to localStorage
 * This ensures that on page refresh, data is hydrated instantly from cache
 */
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'OFLEX_STUDIO_CACHE',
});

persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    hydrateOptions: {},
});

// Helper for manual hydration if needed (though persistQueryClient handles most cases)
export const getInitialData = (key: string) => {
    try {
        const cache = localStorage.getItem('OFLEX_STUDIO_CACHE');
        if (!cache) return undefined;
        const parsed = JSON.parse(cache);
        // Find the specific query in the persisted state
        const query = parsed.clientState.queries.find((q: any) => q.queryKey[0] === key);
        return query?.state?.data;
    } catch (error) {
        return undefined;
    }
};
