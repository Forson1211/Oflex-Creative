
/**
 * Optimizes image URLs for Supabase Storage and Unsplash
 */
export const getOptimizedImageUrl = (url: string, width: number, quality: number = 80): string => {
    if (!url) return '';

    try {
        const urlObj = new URL(url);

        // Initial check for Supabase Storage URL
        const isSupabase = urlObj.hostname.includes('supabase.co');

        // Check for Unsplash
        const isUnsplash = urlObj.hostname.includes('unsplash.com');

        if (isSupabase) {
            // Supabase image transformation
            // Use 'transform' or simple params depending on setup, but typically /render/image/public or ?width=
            // The standard storage transformation is via query params on the public URL if Image Transformation is enabled.
            // We'll append/update the width param.

            // If it's already using some transformation, we preserve it but update width/quality
            urlObj.searchParams.set('width', width.toString());
            urlObj.searchParams.set('q', quality.toString());
            urlObj.searchParams.set('format', 'origin'); // Attempt to leverage WebP/AVIF if supported implicitly or 'origin'
            return urlObj.toString();
        }

        if (isUnsplash) {
            // Unsplash optimization
            urlObj.searchParams.set('w', width.toString());
            urlObj.searchParams.set('q', quality.toString());
            urlObj.searchParams.set('auto', 'format');
            urlObj.searchParams.set('fit', 'crop');
            return urlObj.toString();
        }

        // Return original if no optimization strategy found
        return url;
    } catch (e) {
        // If URL parsing fails, return original
        return url;
    }
};

/**
 * Generates srcSet string for an image
 */
export const generateSrcSet = (url: string): string => {
    const widths = [640, 768, 1024, 1280, 1536];
    return widths
        .map((w) => `${getOptimizedImageUrl(url, w)} ${w}w`)
        .join(', ');
};
