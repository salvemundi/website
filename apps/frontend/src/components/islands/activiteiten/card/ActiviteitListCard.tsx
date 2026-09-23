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
            className={`group relative z-0 flex w-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-transparent bg-(--bg-card) p-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md md:flex-row dark:border-white/10 ${isPast ? 'opacity-75 grayscale-50' : ''}`}
        >
            {/* Image Section */}
            <div className="relative aspect-video w-full shrink-0 overflow-hidden md:w-64">
                {image ? (
                    <MediaAsset
                        asset={image}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        objectFit="contain"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-transparent">
                        <Calendar className="size-8 text-(--theme-purple)/20" />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="relative z-10 flex flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
                    <div className="min-w-50 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-md bg-(--theme-purple) px-2 py-0.5 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                                {committeeLabel}
                            </span>
                            {onlyMembers && (
                                <span className="rounded-md bg-(--theme-warning) px-2 py-0.5 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                                    Leden
                                </span>
                            )}
                        </div>
                        <h3 className="line-clamp-2 text-xl leading-tight font-bold wrap-break-word text-(--theme-purple)/90 transition-colors group-hover:text-(--theme-purple)" title={title}>
                            {title}
                        </h3>
                        {short_description ? (
                            <div className="mt-2 line-clamp-6 hidden overflow-hidden pr-4 text-sm leading-relaxed wrap-break-word text-(--text-muted) md:block">
                                <SafeMarkdown content={short_description} className="prose-sm text-(--text-muted)! prose-headings:my-1 prose-p:my-1" />
                            </div>
                        ) : description ? (
                            <p className="mt-2 line-clamp-2 hidden overflow-hidden pr-4 text-sm leading-relaxed wrap-break-word text-(--text-muted) md:block">
                                {description}
                            </p>
                        ) : null}
                        {contact && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-(--text-muted)">
                                <span className="font-bold opacity-70">Contact:</span>
                                <span>{contact}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex flex-row items-center gap-6 lg:gap-10">
                        <div className="min-w-35 shrink-0 text-left lg:text-right">
                            <p className="mb-1 text-[10px] leading-none font-black tracking-widest text-(--theme-purple)/40 uppercase">Datum & Tijd</p>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold whitespace-nowrap text-(--theme-purple)/80">
                                    {displayDate}
                                </p>
                                <p className="max-w-45 truncate text-xs font-medium text-(--text-muted)">
                                    {timeRange ? `${timeRange} • ` : ''}{location || 'Locatie volgt'}
                                </p>
                            </div>
                        </div>

                        <div className="ml-auto min-w-20 rounded-xl border border-(--border-color) bg-(--bg-soft) px-4 py-2 text-center">
                            <p className="mb-0.5 text-[10px] font-black tracking-widest text-(--theme-purple)/40 uppercase">Prijs</p>
                            <p className="text-lg font-black text-(--theme-purple)">€{safePrice}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-(--border-color)/10 pt-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails?.();
                        }}
                        className="form-button rounded-full px-4 py-2 text-sm font-semibold text-white"
                    >
                        Meer Informatie
                    </button>

                    {!isPast && (
                        <button
                            onClick={handleSignupClick}
                            className={`form-button rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-200 
                                ${cannotSignUp
                                    ? 'bg-(--bg-soft) text-(--text-muted)'
                                    : 'bg-(--theme-purple) text-white shadow-(--theme-purple)/30 shadow-lg hover:-translate-y-0.5 hover:shadow-xl'
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