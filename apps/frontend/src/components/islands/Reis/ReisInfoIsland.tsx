'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getImageUrl } from '@/shared/lib/api/salvemundi'; // Keeping legacy getImageUrl logic, assuming it returns directus URL
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { ReisTrip } from '@salvemundi/validations';

interface ReisInfoIslandProps {
    nextTrip: ReisTrip | null;
}

export function ReisInfoIsland({ nextTrip }: ReisInfoIslandProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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

    const nextTripStartDate = nextTrip?.start_date
        ? new Date(nextTrip.start_date)
        : nextTrip?.event_date
            ? new Date(nextTrip.event_date)
            : null;

    const nextTripEndDate = nextTrip?.end_date
        ? new Date(nextTrip.end_date)
        : nextTrip?.event_date
            ? new Date(nextTrip.event_date)
            : null;

    const formattedFromDate =
        nextTripStartDate && !isNaN(nextTripStartDate.getTime())
            ? format(nextTripStartDate, 'd MMMM yyyy', { locale: nl })
            : null;

    const formattedUntilDate =
        nextTripEndDate && !isNaN(nextTripEndDate.getTime())
            ? format(nextTripEndDate, 'd MMMM yyyy', { locale: nl })
            : null;

    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8">
            {/* Image + Date Card */}
            {nextTrip && (
                <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card">
                    {nextTrip.image && (
                        <button
                            type="button"
                            onClick={() => openLightbox(getImageUrl(nextTrip.image!))}
                            className="w-full rounded-xl sm:rounded-2xl overflow-hidden focus:outline-none group relative"
                        >
                            <img
                                src={getImageUrl(nextTrip.image)}
                                alt={nextTrip.name}
                                className="w-full max-h-64 sm:max-h-80 md:max-h-96 h-auto object-contain rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/img/placeholder.svg';
                                }}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-md text-sm sm:text-base">Bekijk afbeelding</span>
                            </div>
                        </button>
                    )}

                    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-theme-white-soft dark:bg-white/5 rounded-xl sm:rounded-2xl border border-theme-purple/10 dark:border-white/5">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-theme-purple/10 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-theme-purple" />
                            </div>
                            <div>
                                <p className="text-theme-text-muted text-xs font-semibold uppercase tracking-wider">Datum Reis</p>
                                <p className="text-base sm:text-lg md:text-xl font-bold text-theme-purple dark:text-theme-white mt-0.5 break-words">
                                    {formattedFromDate && formattedUntilDate ? (
                                        formattedFromDate === formattedUntilDate ? formattedFromDate : `${formattedFromDate} — ${formattedUntilDate}`
                                    ) : (
                                        'Nog te bepalen'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            {nextTrip?.description && (
                <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card">
                    <h2 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-theme-white mb-4 sm:mb-6 flex items-center gap-2">
                        <span>✈️</span> Over de Reis
                    </h2>
                    <div
                        className="text-theme-text-muted dark:text-theme-text-muted space-y-4 prose prose-sm sm:prose prose-purple dark:prose-invert max-w-none prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: nextTrip.description }}
                    />
                </div>
            )}

            {/* Important Info */}
            <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card">
                <h2 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-theme-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span>ℹ️</span> Belangrijke Informatie
                </h2>
                <ul className="space-y-3 sm:space-y-4">
                    {[
                        { icon: '👥', text: 'Je hoeft <strong>geen lid</strong> te zijn om deel te nemen' },
                        { icon: '📧', text: 'Je ontvangt een bevestigingsmail na inschrijving' },
                        { icon: '🔞', text: 'Minimumleeftijd: 18 jaar' },
                        { icon: '🪪', text: 'Gebruik je volledige naam zoals op je paspoort/ID' },
                        { icon: '📞', text: 'Bij vragen? Neem contact op via <a href="mailto:reis@salvemundi.nl" class="text-theme-purple underline font-semibold">reis@salvemundi.nl</a>' },
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 sm:gap-4">
                            <span className="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
                            <span className="text-sm sm:text-base text-theme-text-muted leading-snug" dangerouslySetInnerHTML={{ __html: item.text }} />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && lightboxSrc && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={closeLightbox}
                        aria-label="Sluiten"
                        className="absolute top-6 right-6 text-white text-4xl leading-none hover:scale-110 transition-transform"
                    >
                        ×
                    </button>
                    <img
                        src={lightboxSrc}
                        alt={nextTrip?.name || 'Reis afbeelding'}
                        className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
