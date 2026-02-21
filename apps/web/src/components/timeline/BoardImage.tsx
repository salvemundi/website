'use client';

import { useState } from 'react';

interface BoardImageProps {
    src: string;
    alt: string;
    className?: string;
}

/**
 * BoardImage is a Client Island that handles its own local onError state
 * to avoid hydration/serialization errors in Server Components.
 * it strictly uses object-contain to ensure the full group photo is visible.
 */
export default function BoardImage({ src, alt, className = '' }: BoardImageProps) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={`${className} object-contain transition duration-500 group-hover:scale-105`}
            style={{ maxHeight: '300px' }}
            loading="lazy"
            onError={() => setImgSrc('/img/placeholder.svg')}
        />
    );
}
