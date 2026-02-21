'use client';

import { useState } from 'react';
import { ArrowLeft, Users2 } from 'lucide-react';
import SmartImage from '@/shared/ui/SmartImage';

interface CommitteeImageModalProps {
    imageUrl: string;
    cleanName: string;
    isBestuur: boolean;
}

export default function CommitteeImageModal({ imageUrl, cleanName, isBestuur }: CommitteeImageModalProps) {
    const [imageModalOpen, setImageModalOpen] = useState(false);

    return (
        <>
            <div className={`group relative overflow-hidden rounded-3xl bg-[var(--bg-card)] shadow-lg dark:border dark:border-white/10 ${isBestuur ? "h-auto min-h-[400px]" : "h-96"}`}>
                <button
                    onClick={() => setImageModalOpen(true)}
                    className={`relative w-full outline-none ${isBestuur ? "h-auto" : "h-full"}`}
                    aria-label="Vergroot afbeelding"
                >
                    <div className={`relative w-full ${isBestuur ? "aspect-auto" : "h-full"}`}>
                        <SmartImage
                            src={imageUrl}
                            alt={cleanName}
                            fill={!isBestuur}
                            width={isBestuur ? 1200 : undefined}
                            height={isBestuur ? 800 : undefined}
                            className={`${isBestuur ? "relative h-auto w-full object-contain" : "object-cover"} transition duration-700 group-hover:scale-105`}
                            priority
                        />
                    </div>
                    <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20 flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300 bg-white/90 dark:bg-black/80 p-3 rounded-full shadow-xl">
                            <Users2 className="h-6 w-6 text-theme-purple" />
                        </div>
                    </div>
                </button>
            </div>

            {imageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setImageModalOpen(false)} />
                    <div className="relative z-10 max-h-full max-w-full">
                        <button
                            onClick={() => setImageModalOpen(false)}
                            className="absolute -top-12 right-0 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        >
                            <span className="text-sm font-bold">Sluiten</span>
                            <div className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5 rotate-90" /></div>
                        </button>
                        <div className="relative h-[85vh] w-screen max-w-5xl">
                            <SmartImage
                                src={imageUrl}
                                alt={cleanName}
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
