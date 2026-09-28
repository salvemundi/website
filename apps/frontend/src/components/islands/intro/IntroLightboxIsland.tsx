'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

const IMAGES = [
    { src: '/img/Intro-2-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro-3-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro-4-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro2025.jpg', alt: 'Introductie Sfeer' },
];

export const IntroLightboxIsland = () => {
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxSrc(null);
    };

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeLightbox();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen]);

    const openLightbox = (src: string) => {
        setLightboxSrc(src);
        setLightboxOpen(true);
    };

    return (
        <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {IMAGES.map((img, idx) => {
                    const isFailed = failedImages.has(img.src);

                    return (
                        <div
                            key={idx}
                            className="relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-purple-100 bg-purple-50 transition-opacity hover:opacity-80 dark:border-white/10 dark:bg-white/5"
                            onClick={() => openLightbox(img.src)}
                        >
                            {isFailed ? (
                                <FallbackLogo className="object-contain p-6" />
                            ) : (
                                <Image
                                    src={img.src}
                                    alt={img.alt}
                                    fill
                                    sizes="(max-width: 640px) 50vw, 33vw"
                                    className="object-cover"
                                    onError={() => setFailedImages(prev => new Set([...prev, img.src]))}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {lightboxOpen && lightboxSrc && (
                <div
                    className="bg-background/80 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm duration-300 sm:p-6"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeLightbox();
                        }
                    }}
                >
                    <button
                        onClick={closeLightbox}
                        className="bg-background/80 hover:bg-background text-foreground/60 hover:text-foreground border-border absolute top-4 right-4 z-50 icon-button rounded-full border p-2 backdrop-blur-sm transition-colors"
                        aria-label="Sluiten"
                    >
                        ×
                    </button>

                    <div
                        className="relative h-[80vh] w-full max-w-7xl overflow-hidden rounded-3xl bg-black/20 p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {failedImages.has(lightboxSrc) ? (
                            <FallbackLogo className="object-contain p-12" />
                        ) : (
                            <Image
                                src={lightboxSrc}
                                alt="Foto"
                                fill
                                className="rounded-2xl object-contain"
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};