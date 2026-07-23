'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';

interface ActiviteitListCardProps {
    title: string;
    image: string | { id: string; type?: string | null } | null;
    displayDate: string;
    timeRange: string | null;
    location: string | null;
    description: string;
    short_description?: string | null;
    safePrice: string;
    committeeLabel: string;
    onlyMembers: boolean;
    isPast: boolean;
    cannotSignUp: boolean;
    alreadySignedUp: boolean;
    isDeadlinePassed: boolean;
    contact?: string;
    handleSignupClick: (e: React.MouseEvent) => void;
    onShowDetails?: () => void;
}

export default function ActiviteitListCard({
    title,
    image,
    displayDate,
    timeRange,
    location,
    description,
    short_description,
    safePrice,
    committeeLabel,
    onlyMembers,
    isPast,
    cannotSignUp,
    alreadySignedUp,
    isDeadlinePassed,
    contact,
    handleSignupClick,
    onShowDetails
}: ActiviteitListCardProps) {
    return (
        <div
            onClick={onShowDetails}
            className={`group relative z-0 overflow-hidden w-full rounded-[1.75rem] bg-(--bg-card) border border-transparent dark:border-white/10 p-0 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 flex flex-col md:flex-row ${isPast ? 'opacity-75 grayscale-50' : ''}`}
        >
            {/* Image Section */}
            <div className="relative w-full md:w-64 aspect-video shrink-0 overflow-hidden">
                {image ? (
                    <MediaAsset
                        asset={image}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        objectFit="contain"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-transparent">
                        <Calendar className="h-8 w-8 text-(--theme-purple)/20" />
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 flex-1">
                    <div className="flex-1 min-w-50">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-white font-black bg-(--theme-purple) px-2 py-0.5 rounded-md shadow-sm">
                                {committeeLabel}
                            </span>
                            {onlyMembers && (
                                <span className="text-[10px] uppercase tracking-widest text-white font-black bg-(--theme-warning) px-2 py-0.5 rounded-md shadow-sm">
                                    Leden
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-(--theme-purple)/90 leading-tight group-hover:text-(--theme-purple) transition-colors line-clamp-2 wrap-break-word" title={title}>
                            {title}
                        </h3>
                        {short_description ? (
                            <div className="hidden md:block text-(--text-muted) text-sm line-clamp-6 mt-2 leading-relaxed pr-4 wrap-break-word overflow-hidden">
                                <SafeMarkdown content={short_description} className="text-(--text-muted)! prose-sm prose-p:my-1 prose-headings:my-1" />
                            </div>
                        ) : description ? (
                            <p className="hidden md:block text-(--text-muted) text-sm line-clamp-2 mt-2 leading-relaxed pr-4 wrap-break-word overflow-hidden">
                                {description}
                            </p>
                        ) : null}
                        {contact && (
                            <p className="text-xs text-(--text-muted) mt-2 flex items-center gap-1">
                                <span className="font-bold opacity-70">Contact:</span>
                                <span>{contact}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex flex-row items-center gap-6 lg:gap-10">
                        <div className="text-left lg:text-right min-w-35 shrink-0">
                            <p className="text-[10px] font-black text-(--theme-purple)/40 uppercase tracking-widest mb-1 leading-none">Datum & Tijd</p>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-(--theme-purple)/80 whitespace-nowrap">
                                    {displayDate}
                                </p>
                                <p className="text-xs font-medium text-(--text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-45">
                                    {timeRange ? `${timeRange} • ` : ''}{location || 'Locatie volgt'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-(--bg-soft) px-4 py-2 rounded-xl border border-(--border-color) text-center min-w-20 ml-auto">
                            <p className="text-[10px] font-black text-(--theme-purple)/40 uppercase tracking-widest mb-0.5">Prijs</p>
                            <p className="text-lg font-black text-(--theme-purple)">€{safePrice}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 mt-4 pt-4 border-t border-(--border-color)/10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails?.();
                        }}
                        className="form-button px-4 py-2 text-sm font-semibold rounded-full text-white"
                    >
                        Meer Informatie
                    </button>

                    {!isPast && (
                        <button
                            onClick={handleSignupClick}
                            className={`form-button px-4 py-2 text-sm font-semibold rounded-full transition-transform duration-200 
                                ${cannotSignUp
                                    ? 'bg-(--bg-soft) text-(--text-muted)'
                                    : 'bg-(--theme-purple) text-white shadow-lg shadow-(--theme-purple)/30 hover:-translate-y-0.5 hover:shadow-xl'
                                }`}
                        >
                            {alreadySignedUp ? 'Al Aangemeld' : isDeadlinePassed ? 'Aanmelding Gesloten' : 'Aanmelden'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}