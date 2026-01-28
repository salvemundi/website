'use client';

import { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
    src: string | undefined | null;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    className?: string;
    priority?: boolean;
    quality?: number;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    fallbackSrc?: string;
    onError?: () => void;
}

/**
 * OptimizedImage component that wraps Next.js Image with proper error handling
 * and fallback support for invalid or missing images.
 */
export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    fill = false,
    sizes,
    className = '',
    priority = false,
    quality = 75,
    objectFit = 'cover',
    fallbackSrc = '/img/placeholder.svg',
    onError,
}: OptimizedImageProps) {
    const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImgSrc(fallbackSrc);
            onError?.();
        }
    };

    // If no src provided, use fallback immediately
    if (!src) {
        return fill ? (
            <Image
                src={fallbackSrc}
                alt={alt}
                fill
                sizes={sizes}
                className={className}
                style={{ objectFit }}
            />
        ) : (
            <Image
                src={fallbackSrc}
                alt={alt}
                width={width || 100}
                height={height || 100}
                className={className}
                style={{ objectFit }}
            />
        );
    }

    // For fill images
    if (fill) {
        return (
            <Image
                src={imgSrc}
                alt={alt}
                fill
                sizes={sizes}
                className={className}
                style={{ objectFit }}
                priority={priority}
                quality={quality}
                loading={priority ? undefined : 'lazy'}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
                onError={handleError}
            />
        );
    }

    // For fixed size images
    return (
        <Image
            src={imgSrc}
            alt={alt}
            width={width || 100}
            height={height || 100}
            sizes={sizes}
            className={className}
            style={{ objectFit }}
            priority={priority}
            quality={quality}
            loading={priority ? undefined : 'lazy'}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
            onError={handleError}
        />
    );
}
