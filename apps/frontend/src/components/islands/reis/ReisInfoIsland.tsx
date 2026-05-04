'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, Info, ShieldCheck, Mail, MapPin, ExternalLink, Camera } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { ReisTrip } from '@salvemundi/validations/schema/reis.zod';
import { SafeHtml } from '@/components/ui/security/SafeHtml';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

interface ReisInfoIslandProps {
    nextTrip: ReisTrip | null;
}

export function ReisInfoIsland({ nextTrip }: ReisInfoIslandProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    const openLightbox = (src: string) => {
        setLightboxSrc(src);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxSrc(null);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
        };
        if (lightboxOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen]);

    const nextTripStartDate = nextTrip?.start_date ? new Date(nextTrip.start_date) : null;
    const nextTripEndDate = nextTrip?.end_date ? new Date(nextTrip.end_date) : null;

    const formattedFromDate = nextTripStartDate && !isNaN(nextTripStartDate.getTime())
        ? format(nextTripStartDate, 'd MMMM yyyy', { locale: nl })
        : null;

    const formattedUntilDate = nextTripEndDate && !isNaN(nextTripEndDate.getTime())
        ? format(nextTripEndDate, 'd MMMM yyyy', { locale: nl })
        : null;

    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8">
            {/* Image + Date Hero Card */}
            {nextTrip && (
                <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl group relative">
                    {nextTrip.image ? (
                        <div className="relative w-full h-[300px] sm:h-[400px] overflow-hidden">
                            <Image
                                src={imageError ? '/img/placeholder.svg' : (getImageUrl(nextTrip.image) ?? '/img/placeholder.svg')}
                                alt={nextTrip.name}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                unoptimized
                                onError={() => setImageError(true)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            {/* Overlay Title */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-lg">
                                    {nextTrip.name}
                                </h2>
                                <div className="flex items-center gap-2 text-white/80 mt-2 font-medium">
                                    <MapPin className="h-4 w-4 text-theme-purple" />
                                    <span>Bestemming volgt</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => openLightbox(getImageUrl(nextTrip.image) ?? '')}
                                className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-white hover:bg-white/20 transition-all active:scale-90"
                            >
                                <Camera className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="h-24 bg-theme-purple/10" />
                    )}

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-theme-purple/10 flex items-center justify-center flex-shrink-0 border border-theme-purple/20">
                                    <Calendar className="h-7 w-7 text-theme-purple" />
                                </div>
                                <div>
                                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Wanneer gaan we?</p>
                                    <p className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-theme-white mt-1">
                                        {formattedFromDate && formattedUntilDate ? (
                                            formattedFromDate === formattedUntilDate ? formattedFromDate : `${formattedFromDate} — ${formattedUntilDate}`
                                        ) : (
                                            'Wordt aangekondigd'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Description Card */}
            {nextTrip?.description && (
                <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-theme-purple/5 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <h3 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-theme-white mb-6 flex items-center gap-3">
                            <div className="h-8 w-1 bg-theme-purple rounded-full" />
                            Over de Reis
                        </h3>
                        <SafeHtml
                            className="text-[var(--text-muted)] dark:text-[var(--text-muted)] space-y-4 prose prose-sm sm:prose prose-purple dark:prose-invert max-w-none prose-p:leading-relaxed font-medium"
                            html={nextTrip.description}
                        />
                    </div>
                </div>
            )}

            {/* Important Info Card */}
            <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck className="h-32 w-32 text-theme-purple" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-theme-white mb-8 flex items-center gap-3">
                        <div className="h-8 w-1 bg-theme-purple rounded-full" />
                        Goed om te weten
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { icon: <ShieldCheck className="h-5 w-5" />, title: 'Lidmaatschap', text: 'Je hoeft <strong>geen lid</strong> te zijn om mee te gaan.' },
                            { icon: <Mail className="h-5 w-5" />, title: 'Bevestiging', text: 'Je krijgt direct een mail na je inschrijving.' },
                            { icon: <Info className="h-5 w-5" />, title: 'Leeftijd', text: 'Minimumleeftijd voor deelname is 18 jaar.' },
                            { icon: <ExternalLink className="h-5 w-5" />, title: 'Vragen?', text: 'Mail ons op <a href="mailto:reis@salvemundi.nl" class="text-theme-purple font-bold">reis@salvemundi.nl</a>' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="h-10 w-10 rounded-xl bg-theme-purple/5 text-theme-purple flex items-center justify-center flex-shrink-0 group-hover:bg-theme-purple/10 transition-colors border border-theme-purple/10">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{item.title}</p>
                                    <SafeHtml as="div" className="text-sm text-[var(--text-main)] font-medium leading-relaxed" html={item.text} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && lightboxSrc && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={closeLightbox}
                        aria-label="Sluiten"
                        className="absolute top-8 right-8 text-white hover:scale-110 transition-transform bg-white/10 p-4 rounded-2xl border border-white/20"
                    >
                        <ExternalLink className="h-6 w-6 rotate-45" />
                    </button>
                    <div
                        className="relative w-full max-w-6xl h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={lightboxSrc}
                            alt={nextTrip?.name || 'Reis afbeelding'}
                            fill
                            className="object-contain rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
