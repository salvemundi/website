'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const IMAGES = [
    { src: '/img/backgrounds/homepage-banner.jpg', alt: 'polonaise' },
    { src: '/img/Intro-2-2025.jpg', alt: 'polonaise' },
    { src: '/img/Intro-3-2025.jpg', alt: 'lasergame' },
    { src: '/img/Intro-4-2025.jpg', alt: 'Groep' },
    { src: '/img/Intro2025.jpg', alt: 'Groep' },
];

export const IntroLightboxIsland = () => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
        setLightboxSrc(src);
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
                    <div key={idx} className="relative h-32 w-full">
                        <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox(img.src)}
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
