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
    fetchPriority = 'high',
    sizes,
    ...props
}: OptimizedImageProps) => {
    const optimizedSrc = width ? getOptimizedImageUrl(src, width) : src;
    const srcSet = generateSrcSet(src);
    const imgRef = useRef<HTMLImageElement>(null);

    // Initialize isLoaded to true by default so images render immediately without waiting for opacity transitions
    const [isLoaded, setIsLoaded] = useState(true);

    useLayoutEffect(() => {
        if (imgRef.current?.complete && imgRef.current?.naturalWidth !== 0) {
            LOADED_IMAGE_CACHE.add(optimizedSrc);
            LOADED_IMAGE_CACHE.add(src);
        }
    }, [optimizedSrc, src]);

    return (
        <div className={cn("relative overflow-hidden bg-[#f1f5f9]/50 dark:bg-muted/20", className)}>
            <img
                ref={imgRef}
                src={optimizedSrc}
                srcSet={srcSet}
                sizes={sizes}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                // @ts-ignore
                fetchPriority={fetchPriority}
                className={cn(
                    "w-full h-full object-cover block",
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
