import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    quality?: number;
    priority?: boolean;
    className?: string;
}

export const Image = ({
    src,
    alt,
    width,
    height,
    quality = 80,
    priority = false,
    className,
    ...props
}: ImageProps) => {
    const [isLoading, setIsLoading] = useState(true);

    const optimizedSrc = useMemo(() => {
        if (!src || !src.includes('supabase.co') || !src.includes('/storage/v1/object/public/')) {
            return src;
        }

        try {
            const url = new URL(src);
            if (width) url.searchParams.set('width', width.toString());
            if (height) url.searchParams.set('height', height.toString());
            url.searchParams.set('quality', quality.toString());
            url.searchParams.set('format', 'webp');
            return url.toString();
        } catch (e) {
            return src;
        }
    }, [src, width, height, quality]);

    return (
        <img
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoading(false)}
            className={cn(
                'transition-all duration-500 ease-in-out',
                isLoading ? 'scale-105 blur-sm grayscale' : 'scale-100 blur-0 grayscale-0',
                className
            )}
            {...props}
        />
    );
};