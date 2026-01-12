'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CommitteeImageProps {
    src: string;
    alt: string;
    className?: string;
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export default function CommitteeImage({ src, alt, className, onError }: CommitteeImageProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Check if the source is a GIF
    const isGif = src.toLowerCase().endsWith('.gif');

    // Determine which image to show
    // If it's a GIF and NOT hovered, show the logo
    // Otherwise (static image or hovered GIF), show the actual source
    const displaySrc = isGif && !isHovered ? '/img/newlogo.png' : src;

    const isExternal = /^https?:\/\//i.test(displaySrc) || displaySrc.includes('access_token=');

    // When the image is external or contains an access token, avoid Next.js image optimization
    // which proxies the request via /_next/image (can trigger 403 for protected Directus assets).
    if (isExternal) {
        return (
            <div
                className={`relative h-full w-full ${className || ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <img
                    src={displaySrc}
                    alt={alt}
                    className={`${isGif && !isHovered ? 'object-contain p-8 bg-white/50' : 'object-cover'} h-full w-full`}
                    loading="lazy"
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
        <div
            className="relative h-full w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Image
                src={displaySrc}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                className={`${className} ${isGif && !isHovered ? 'object-contain p-8 bg-white/50' : 'object-cover'}`}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg=="
                onError={onError}
            />
        </div>
    );
}
