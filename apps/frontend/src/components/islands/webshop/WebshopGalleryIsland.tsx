'use client';

import { useEffect, useState } from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { ImageOff } from 'lucide-react';
import { type WebshopProductMedia } from '@salvemundi/validations/schema/webshop.zod';

interface WebshopGalleryIslandProps {
    media: WebshopProductMedia[];
    productName: string;
}

export default function WebshopGalleryIsland({ media, productName }: WebshopGalleryIslandProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        if (!lightboxOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
        };
    }, [lightboxOpen]);

    if (media.length === 0) {
        return (
            <div className="w-full aspect-square rounded-[1.75rem] bg-(--bg-soft) flex items-center justify-center">
                <ImageOff className="h-12 w-12 text-(--theme-purple)/20" />
            </div>
        );
    }

    const active = media[activeIndex];

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="relative w-full aspect-square rounded-[1.75rem] overflow-hidden bg-(--bg-soft) block cursor-zoom-in"
                aria-label={`${productName} - vergroot media ${activeIndex + 1}`}
            >
                <MediaAsset
                    asset={{ id: active.asset, type: active.asset_type }}
                    alt={`${productName} - foto ${activeIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    objectFit="cover"
                    priority
                />
            </button>

            {media.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                    {media.map((item, idx) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${idx === activeIndex ? 'border-(--theme-purple)' : 'border-transparent hover:border-(--border-color)'}`}
                            aria-label={`Bekijk media ${idx + 1}`}
                            aria-current={idx === activeIndex}
                        >
                            <MediaAsset
                                asset={{ id: item.asset, type: item.asset_type }}
                                alt={`${productName} - miniatuur ${idx + 1}`}
                                fill
                                sizes="20vw"
                                objectFit="cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {lightboxOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${productName} - vergrote weergave`}
                    className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setLightboxOpen(false);
                    }}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background text-foreground/60 hover:text-foreground backdrop-blur-sm transition-colors border border-border"
                        aria-label="Sluiten"
                    >
                        ×
                    </button>

                    <div className="relative w-full max-w-4xl h-[80vh] overflow-hidden rounded-3xl bg-black/20 p-2" onClick={(e) => e.stopPropagation()}>
                        <MediaAsset
                            asset={{ id: active.asset, type: active.asset_type }}
                            alt={`${productName} - vergrote foto ${activeIndex + 1}`}
                            fill
                            objectFit="contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
