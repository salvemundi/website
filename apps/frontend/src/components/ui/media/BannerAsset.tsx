'use client';

import React from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';

interface BannerAssetProps {
    asset?: string | { id: string; type?: string | null } | null;
    alt?: string;
    className?: string;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    unoptimized?: boolean;
}

/**
 * A global component to handle activity banners.
 * Automatically detects if the asset is a video (MP4) or an image.
 * Videos are rendered as autoplaying, looping, muted elements (GIF-like).
 */
export default function BannerAsset({
    asset,
    alt = 'Banner',
    className = '',
    fill = false,
    sizes,
    priority = false,
    loading,
    unoptimized = true,
}: BannerAssetProps) {
    if (!asset) return null;

    const id = typeof asset === 'string' ? asset : asset?.id;
    const type = typeof asset === 'object' ? asset?.type : null;
    
    const url = getImageUrl(id);

    if (!url) return null;

    if (type?.startsWith('video/')) {
        return (
            <video
                src={url}
                className={`${className} ${fill ? 'absolute inset-0 w-full h-full' : ''}`}
                autoPlay
                loop
                muted
                playsInline
                aria-label={alt}
            />
        );
    }

    return (
        <Image
            src={url}
            alt={alt}
            className={className}
            fill={fill}
            sizes={sizes}
            priority={priority}
            loading={loading}
            unoptimized={unoptimized}
            onError={(e) => {
                // Fallback for cases where type detection failed but it's actually a video
                // This is a last-resort safety measure
                if (type === null || type === undefined) {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                }
            }}
        />
    );
}
