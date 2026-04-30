'use client';

import Image from 'next/image';
import BannerAsset from '@/components/ui/media/BannerAsset';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import type { Activity } from '@salvemundi/validations/schema/activity.zod';
import { formatDate, formatTime } from '@/shared/lib/utils/date';
import FlipClock from './FlipClock';

interface FeaturedEventProps {
    event: Activity;
    onEventClick: (event: Activity) => void;
}

export default function FeaturedEvent({ event, onEventClick }: FeaturedEventProps) {
    if (!event) return null;

    const eventDateStr = event.datum_start;
    const eventTimeStr = event.event_time;

    return (
        <div className="rounded-[2.5rem] bg-gradient-to-br from-[var(--theme-purple)]/5 via-[var(--bg-card)] to-[var(--theme-purple)]/10 p-8 md:p-10 shadow-xl border border-[var(--border-color)] overflow-hidden relative group">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--theme-purple)]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col gap-10">
                {/* Header: Title & Timer */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-[var(--border-color)] pb-8">
                    <div className="space-y-2 max-w-2xl">
                        <span className="text-[10px] font-black text-[var(--theme-purple)] uppercase tracking-[0.2em] opacity-60">
                            Volgende Activiteit
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-[var(--theme-purple)] leading-[1.1]">
                            {event.titel}
                        </h2>
                    </div>
                    
                    <div className="flex-shrink-0">
                        <FlipClock 
                            targetDate={eventTimeStr ? `${eventDateStr}T${eventTimeStr}` : eventDateStr} 
                            title=""
                        />
                    </div>
                </div>

                {/* Body: Image & Details */}
                <div className="flex flex-col lg:flex-row gap-10 lg:items-stretch">
                    {/* Image Section */}
                    <div 
                        onClick={() => onEventClick(event)}
                        className="lg:w-2/3 aspect-[21/9] md:aspect-[16/7] lg:aspect-auto min-h-[300px] rounded-3xl overflow-hidden relative cursor-pointer group/img shadow-2xl border border-[var(--border-color)]"
                    >
                        {event.afbeelding_id ? (
                            <BannerAsset
                                asset={event.afbeelding_id}
                                alt={event.titel || 'Featured Event'}
                                fill
                                sizes="(max-width: 1024px) 100vw, 800px"
                                className="object-cover transition-transform duration-700 group-hover/img:scale-105"
                                priority
                                loading="eager"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--theme-purple)]/5">
                                <Calendar className="h-20 w-20 text-[var(--theme-purple)]/10" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Info Section */}
                    <div className="lg:w-1/3 flex flex-col justify-between py-2 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-4 text-lg">
                                <div className="flex items-center gap-4 text-[var(--theme-purple)] font-black">
                                    <div className="p-3 bg-[var(--theme-purple)]/10 rounded-2xl">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-xs uppercase tracking-widest opacity-50 font-black">Datum & Tijd</span>
                                        <span className="mt-0.5">{formatDate(event.datum_start, 'EEEE d MMMM')} om {formatTime(event.event_time) || 'TBD'}</span>
                                    </div>
                                </div>
                                
                                {event.locatie && (
                                    <div className="flex items-center gap-4 text-[var(--text-main)] font-bold">
                                        <div className="p-3 bg-[var(--bg-soft)] rounded-2xl border border-[var(--border-color)]">
                                            <MapPin className="h-6 w-6 text-[var(--theme-purple)]" />
                                        </div>
                                        <div className="flex flex-col leading-tight">
                                            <span className="text-xs uppercase tracking-widest opacity-50 font-black">Locatie</span>
                                            <span className="mt-0.5">{event.locatie}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-[var(--text-muted)] leading-relaxed line-clamp-4 font-medium italic opacity-80">
                                "{event.beschrijving ? (event.beschrijving.length > 180 ? event.beschrijving.substring(0, 180) + '...' : event.beschrijving) : 'Geen omschrijving beschikbaar.'}"
                            </p>
                        </div>

                        <button 
                            onClick={() => onEventClick(event)}
                            className="w-full group/btn relative overflow-hidden rounded-[1.25rem] bg-[var(--theme-purple)] py-5 font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[var(--theme-purple)]/20"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                BEKIJK DETAILS
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover/btn:translate-x-1">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
