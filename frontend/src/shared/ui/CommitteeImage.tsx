'use client';

import React, { useState } from 'react';

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

    return (
        <div
            className="relative h-full w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img
                src={displaySrc}
                alt={alt}
                className={`${className} ${isGif && !isHovered ? 'object-contain p-8 bg-white/50' : 'object-cover'}`}
                onError={onError}
            />
        </div>
    );
}
