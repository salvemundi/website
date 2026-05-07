'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const IMAGES = [
    { src: '/img/backgrounds/Kroto2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/newlogo.svg', alt: 'Salve Mundi Logo' },
];

export const IntroLightboxIsland = () => {
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const fallbackImage = '/img/newlogo.svg';

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxOpen(false);
                setLightboxSrc(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen]);

    const openLightbox = (src: string) => {
        setLightboxSrc(failedImages[src] ? fallbackImage : src);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxSrc(null);
    };

    return (
        <>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {IMAGES.map((img, idx) => (
                    <div key={idx} className="relative h-32 w-full bg-[var(--color-purple-50)] dark:bg-white/5 rounded-lg overflow-hidden border border-[var(--color-purple-100)] dark:border-white/10 flex items-center justify-center">
                        <Image
                            src={failedImages[img.src] ? fallbackImage : img.src}
                            alt={img.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className={`object-cover transition-opacity cursor-pointer hover:opacity-80 ${failedImages[img.src] ? 'p-6 object-contain' : ''}`}
                            onClick={() => openLightbox(img.src)}
                            onError={() => setFailedImages(prev => ({ ...prev, [img.src]: true }))}
                            unoptimized={failedImages[img.src]}
                        />
                    </div>
                ))}
            </div>

            {lightboxOpen && lightboxSrc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeLightbox();
                        }
                    }}
                >
                    <div className="relative max-w-4xl w-full h-[80vh] sm:h-[90vh]">
                        <button
                            onClick={closeLightbox}
                            className="absolute top-2 right-2 z-50 bg-black/40 text-white rounded-full p-2 hover:bg-black/60"
                            aria-label="Sluiten"
                        >
                            ×
                        </button>
                        <Image
                            src={lightboxSrc}
                            alt="Foto"
                            fill
                            sizes="(max-width: 1024px) 90vw, 1024px"
                            className="object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </>
    );
};
