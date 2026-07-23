'use client';

import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';

interface MediaAssetProps {
    asset?: string | { id: string; type?: string | null } | null;
    alt?: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    unoptimized?: boolean;
    objectFit?: 'cover' | 'contain' | 'none' | 'scale-down' | 'fill';
}

export default function MediaAsset({
    asset,
    alt = 'Media asset',
    className = '',
    fill = false,
    width,
    height,
    sizes,
    priority = false,
    loading,
    unoptimized,
    objectFit = 'cover' }: MediaAssetProps) {

    if (!asset) return null;

    const id = typeof asset === 'string' ? asset : asset.id;
    const type = typeof asset === 'object' ? asset.type : null;

    const url = getImageUrl(id, { width, height });
    if (!url) return null;

    const isLocalPreview = typeof id === 'string' && (id.startsWith('data:') || id.startsWith('blob:'));
    const isApiAsset = typeof url === 'string' && url.startsWith('/api/assets/');
    const isVideo = type?.startsWith('video/') ||
        (typeof id === 'string' && (id.includes('video') || id.match(/\.(mp4|webm|ogg|mov)$/i)));

    const shouldOptimize = !unoptimized && !isLocalPreview && !isApiAsset;

    if (isVideo) {
        return (
            <video
                src={url}
                className={`${className} ${fill ? 'absolute inset-0 w-full h-full' : ''}`}
                autoPlay
                loop
                muted
                playsInline
                aria-label={alt}
                style={fill ? { objectFit } : undefined}
            />
        );
    }

    return (
        <Image
            src={url}
            alt={alt}
            className={className}
            fill={fill}
            width={!fill ? (width || 400) : undefined}
            height={!fill ? (height || 300) : undefined}
            sizes={sizes}
            priority={priority}
            loading={loading}
            unoptimized={!shouldOptimize}
            style={fill ? { objectFit } : undefined}
        />
    );
}