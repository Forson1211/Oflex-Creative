import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, generateSrcSet } from '@/lib/image-optimizer';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    imageClassName?: string;
    fetchPriority?: 'high' | 'low' | 'auto';
}

export const OptimizedImage = ({
    src,
    alt,
    className,
    width,
    height,
    priority = false,
    imageClassName,
    fetchPriority = 'auto',
    ...props
}: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(priority); // If priority, assume we want it shown ASAP
    const [error, setError] = useState(false);

    const optimizedSrc = width ? getOptimizedImageUrl(src, width) : src;
    const srcSet = generateSrcSet(src);

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {!isLoaded && !error && !priority && (
                <Skeleton className="absolute inset-0 w-full h-full animate-pulse bg-muted" />
            )}

            <img
                src={optimizedSrc}
                srcSet={srcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                // @ts-ignore - fetchPriority is supported in modern browsers
                fetchPriority={priority ? "high" : fetchPriority}
                className={cn(
                    priority ? "opacity-100" : "transition-opacity duration-500",
                    !isLoaded && !priority ? "opacity-0" : "opacity-100",
                    imageClassName
                )}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    setIsLoaded(true);
                    setError(true);
                }}
                {...props}
            />
        </div>
    );
};
