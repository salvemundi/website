'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CommitteeImageProps {
    src: string;
    alt: string;
    committeeId: number;
    className?: string;
    sizes?: string;
}

function getDefaultCommitteeImage(committeeId: number): string {
    return committeeId % 2 === 0 ? '/img/group-jump.gif' : '/img/groupgif.gif';
}

export default function CommitteeImage({ src, alt, committeeId, className = '', sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px" }: CommitteeImageProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    const isGif = imgSrc.toLowerCase().endsWith('.gif');
    const displaySrc = isGif && !isHovered ? '/img/newlogo.png' : imgSrc;
    const isLocalAsset = displaySrc.startsWith('/api/assets/');
    const isExternal = /^https?:\/\//i.test(displaySrc) || displaySrc.includes('access_token=') || isLocalAsset;

    // Local error handler inside the Client Component
    const handleError = () => {
        setImgSrc(getDefaultCommitteeImage(committeeId));
    };

    if (isExternal) {
        return (
            <div
                className={`relative h-full w-full bg-[var(--bg-main)] ${className}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <img
                    src={displaySrc}
                    alt={alt}
                    className={`${isGif && !isHovered ? 'object-contain p-8 bg-white/50' : 'object-contain'} h-full w-full bg-transparent transform-gpu transition-transform duration-500 will-change-transform`}
                    style={{ backfaceVisibility: 'hidden' }}
                    loading="lazy"
                    onError={handleError}
                />
            </div>
        );
    }

    return (
        <div
            className={`relative h-full w-full bg-[var(--bg-main)] ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Image
                src={displaySrc}
                alt={alt}
                fill
                sizes={sizes}
                className={`${isGif && !isHovered ? 'object-contain p-8 bg-white/50' : 'object-contain'} h-full w-full bg-transparent transform-gpu transition-transform duration-500 will-change-transform`}
                style={{ backfaceVisibility: 'hidden' }}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg=="
                onError={handleError}
            />
        </div>
    );
}
