"use client";

import React from 'react';
import Image from 'next/image';

interface SmartImageProps {
    src: string;
    alt?: string;
    className?: string;
    fill?: boolean;
    sizes?: string;
    width?: number | string;
    height?: number | string;
    loading?: 'lazy' | 'eager';
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    priority?: boolean;
    quality?: number;
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export default function SmartImage({ src, alt = '', className, fill, sizes, width, height, loading, placeholder, blurDataURL, priority, quality, onError }: SmartImageProps) {
    const isTokenized = typeof src === 'string' && src.includes('access_token=');
    const isExternal = typeof src === 'string' && /^https?:\/\//i.test(src);

    const useNative = isTokenized || isExternal;

    if (useNative) {
        // Use native <img> to avoid Next.js optimizer proxying tokenized URLs
        if (fill) {
            return (
                <div className={`relative h-full w-full ${className || ''}`}>
                    <img
                        src={src}
                        alt={alt}
                        className="object-cover h-full w-full"
                        loading={loading || 'lazy'}
                        onError={(e) => {
                            if (onError) onError(e as unknown as React.SyntheticEvent<HTMLImageElement, Event>);
                            const target = e.target as HTMLImageElement;
                            target.src = '/img/placeholder.svg';
                        }}
                    />
                </div>
            );
        }

        return (
            <img
                src={src}
                alt={alt}
                className={className}
                width={typeof width === 'number' ? width : undefined}
                height={typeof height === 'number' ? height : undefined}
                loading={loading || 'lazy'}
                onError={(e) => {
                    if (onError) onError(e as unknown as React.SyntheticEvent<HTMLImageElement, Event>);
                    const target = e.target as HTMLImageElement;
                    target.src = '/img/placeholder.svg';
                }}
            />
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            sizes={sizes}
            width={typeof width === 'number' ? width : undefined}
            height={typeof height === 'number' ? height : undefined}
            className={className}
            loading={loading}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            priority={priority}
            quality={quality}
            onError={onError}
        />
    );
}
