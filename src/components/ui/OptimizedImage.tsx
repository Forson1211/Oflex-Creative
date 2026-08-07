import { useState, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, generateSrcSet } from '@/lib/image-optimizer';

// Global cache of loaded image URLs in this session so cached images render immediately with zero flash
const LOADED_IMAGE_CACHE = new Set<string>();

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    imageClassName?: string;
    fetchPriority?: 'high' | 'low' | 'auto';
    sizes?: string;
}

export const OptimizedImage = ({
    src,
    alt,
    className,
    width,
    height,
    priority = true,
    imageClassName,
    fetchPriority = 'auto',
    sizes,
    ...props
}: OptimizedImageProps) => {
    const optimizedSrc = width ? getOptimizedImageUrl(src, width) : src;
    const srcSet = generateSrcSet(src);
    const imgRef = useRef<HTMLImageElement>(null);

    // Initialize isLoaded to true for static assets, priority images, or cached URLs to prevent flashing
    const [isLoaded, setIsLoaded] = useState(() => {
        if (!src) return true;
        if (priority || LOADED_IMAGE_CACHE.has(optimizedSrc) || LOADED_IMAGE_CACHE.has(src)) return true;
        if (typeof src === 'string' && (src.startsWith('/') || src.startsWith('data:'))) return true;
        return false;
    });

    useLayoutEffect(() => {
        if (imgRef.current?.complete && imgRef.current?.naturalWidth !== 0) {
            LOADED_IMAGE_CACHE.add(optimizedSrc);
            LOADED_IMAGE_CACHE.add(src);
            setIsLoaded(true);
        }
    }, [optimizedSrc, src]);

    return (
        <div className={cn("relative overflow-hidden bg-slate-100/30 dark:bg-muted/20", className)}>
            {/* Subtle non-flash background placeholder */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-200/20 dark:bg-muted/30 pointer-events-none z-0" />
            )}

            <img
                ref={imgRef}
                src={optimizedSrc}
                srcSet={srcSet}
                sizes={sizes}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                // @ts-ignore
                fetchPriority={priority ? "high" : fetchPriority}
                className={cn(
                    "relative z-10 w-full h-full object-cover transition-opacity duration-150 ease-out",
                    isLoaded ? "opacity-100" : "opacity-95",
                    imageClassName
                )}
                onLoad={() => {
                    LOADED_IMAGE_CACHE.add(optimizedSrc);
                    LOADED_IMAGE_CACHE.add(src);
                    setIsLoaded(true);
                }}
                onError={() => {
                    setIsLoaded(true);
                }}
                {...props}
            />
        </div>
    );
};
