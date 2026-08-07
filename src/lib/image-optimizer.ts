/**
 * Optimizes image URLs for Supabase Storage and Unsplash
 */
export const getOptimizedImageUrl = (url: string, width: number, quality: number = 80): string => {
    if (!url) return '';

    try {
        const urlObj = new URL(url);

        const isSupabase = urlObj.hostname.includes('supabase.co');
        const isUnsplash = urlObj.hostname.includes('unsplash.com');

        if (isSupabase) {
            urlObj.searchParams.set('width', width.toString());
            urlObj.searchParams.set('q', quality.toString());
            return urlObj.toString();
        }

        if (isUnsplash) {
            urlObj.searchParams.set('w', width.toString());
            urlObj.searchParams.set('q', quality.toString());
            urlObj.searchParams.set('auto', 'format');
            urlObj.searchParams.set('fit', 'crop');
            return urlObj.toString();
        }

        return url;
    } catch (e) {
        return url;
    }
};

/**
 * Generates srcSet string for supported remote CDN images
 */
export const generateSrcSet = (url: string): string | undefined => {
    if (!url) return undefined;
    if (url.includes('unsplash.com')) {
        const widths = [640, 768, 1024];
        return widths
            .map((w) => `${getOptimizedImageUrl(url, w)} ${w}w`)
            .join(', ');
    }
    return undefined;
};
