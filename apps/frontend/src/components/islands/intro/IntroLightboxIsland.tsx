'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const IMAGES = [
    { src: '/img/Intro-2-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro-3-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro-4-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro2025.jpg', alt: 'Salve Mundi Logo' },
];

export const IntroLightboxIsland = () => {
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
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
        setLightboxSrc(failedImages.has(src) ? fallbackImage : src);
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
                    <div key={idx} className="relative h-32 w-full bg-purple-50 dark:bg-white/5 rounded-lg overflow-hidden border border-purple-100 dark:border-white/10 flex items-center justify-center">
                        <Image
                            src={failedImages.has(img.src) ? fallbackImage : img.src}
                            alt={img.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className={`object-cover transition-opacity cursor-pointer hover:opacity-80 ${failedImages.has(img.src) ? 'p-6 object-contain' : ''}`}
                            onClick={() => openLightbox(img.src)}
                            onError={() => setFailedImages(prev => new Set([...prev, img.src]))}
                            unoptimized={failedImages.has(img.src)}
                        />
                    </div>
                ))}
            </div>

            {lightboxOpen && lightboxSrc && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeLightbox();
                        }
                    }}
                >
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 z-101 bg-white/10 text-white rounded-full p-3 hover:bg-white/20 transition-colors border border-white/20"
                        aria-label="Sluiten"
                    >
                        ×
                    </button>

                    <div
                        className="relative w-full max-w-8xl h-[80vh] overflow-hidden rounded-3xl bg-black/20 p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={lightboxSrc}
                            alt="Foto"
                            fill
                            className="object-cover rounded-2xl"
                        />
                    </div>
                </div>
            )}
        </>
    );
};
