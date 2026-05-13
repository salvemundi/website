'use client';

import React from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';

interface MediaAssetProps {
    /** Asset ID from Directus, or a full URL (blob, data, etc.) */
    asset?: string | { id: string; type?: string | null } | null;
    alt?: string;
    className?: string;
    /** Whether the image should fill its container (requires relative parent) */
    fill?: boolean;
    /** For fixed size images */
    width?: number;
    /** For fixed size images */
    height?: number;
    sizes?: string;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    /** Skip Next.js optimization (useful for local previews/blobs) */
    unoptimized?: boolean;
    /** How the image should fit in its container */
    objectFit?: 'cover' | 'contain' | 'none' | 'scale-down' | 'fill';
}

/**
 * MediaAsset: The central component for rendering any media (Images, GIFs, Videos).
 * Automatically detects type and applies Next.js best practices.
 */
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

    const id = typeof asset === 'string' ? asset : asset?.id;
    const type = typeof asset === 'object' ? asset?.type : null;

    const url = getImageUrl(id, { width, height });
    if (!url) return null;

    // Detection logic
    const isLocalPreview = typeof id === 'string' && (id.startsWith('data:') || id.startsWith('blob:'));
    const isVideo = type?.startsWith('video/') ||
        (typeof id === 'string' && (id.includes('video') || id.match(/\.(mp4|webm|ogg|mov)$/i)));

    // Use unoptimized for local previews or if explicitly requested
    const shouldOptimize = !unoptimized && !isLocalPreview;

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

