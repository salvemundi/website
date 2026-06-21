'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';

interface ActiviteitGridCardProps {
    title: string;
    image: string | { id: string; type?: string | null } | null;
    displayDate: string;
    timeRange: string | null;
    description: string;
    short_description?: string | null;
    safePrice: string;
    committeeLabel: string;
    onlyMembers: boolean;
    isPast: boolean;
    cannotSignUp: boolean;
    alreadySignedUp: boolean;
    handleSignupClick: (e: React.MouseEvent) => void;
    onShowDetails?: () => void;
}

export default function ActiviteitGridCard({
    title,
    image,
    displayDate,
    timeRange,
    description,
    short_description,
    safePrice,
    committeeLabel,
    onlyMembers,
    isPast,
    cannotSignUp,
    alreadySignedUp,
    handleSignupClick,
    onShowDetails
}: ActiviteitGridCardProps) {
    return (
        <div
            onClick={onShowDetails}
            className={`group relative z-0 overflow-hidden w-full rounded-[1.75rem] bg-(--bg-card) dark:border dark:border-white/10 p-0 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 ${isPast ? 'opacity-75 grayscale-50' : ''}`}
        >
            <div className="relative z-10 w-full aspect-video mb-0 overflow-hidden">
                {image ? (
                    <MediaAsset
                        asset={image}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        objectFit="contain"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-transparent">
                        <Calendar className="h-12 w-12 text-(--theme-purple)/20" />
                    </div>
                )}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                    <span className="bg-(--theme-purple) text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider backdrop-blur-md">
                        {committeeLabel}
                    </span>
                    {onlyMembers && (
                        <span className="bg-(--theme-warning) text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider backdrop-blur-md">
                            Leden Alleen
                        </span>
                    )}
                </div>
            </div>

            <div className="p-5 flex flex-col grow relative z-10 space-y-3">
                <h3 className="text-xl font-bold text-(--theme-purple)/90 leading-tight group-hover:text-(--theme-purple) transition-colors line-clamp-2 break-words">
                    {title}
                </h3>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-(--theme-purple)/80 font-bold">
                        <Calendar className="h-4 w-4" />
                        <span>{displayDate}</span>
                    </div>
                    {timeRange && (
                        <p className="text-sm text-(--text-muted) ml-6 font-medium">
                            {timeRange}
                        </p>
                    )}
                </div>

                {short_description ? (
                    <div className="text-(--text-muted) text-sm line-clamp-5 leading-relaxed break-words overflow-hidden">
                        <SafeMarkdown content={short_description} className="!text-(--text-muted) prose-sm prose-p:my-1 prose-headings:my-1" />
                    </div>
                ) : description ? (
                    <p className="text-(--text-muted) text-sm line-clamp-3 leading-relaxed break-words overflow-hidden">
                        {description}
                    </p>
                ) : null}

                <div className="flex items-center justify-between pt-4 mt-auto border-t border-(--border-color)">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-(--theme-purple)/50">Prijs</span>
                        <span className="text-lg font-bold text-(--theme-purple)/80">€{safePrice}</span>
                    </div>

                    <div className="flex gap-2">
                        {!isPast && (
                            <button
                                onClick={handleSignupClick}
                                className={`${cannotSignUp ? 'bg-(--theme-purple)/10 text-(--theme-purple)/40 cursor-not-allowed' : 'bg-(--theme-purple) text-white shadow-lg shadow-(--theme-purple)/20 hover:scale-105'} p-2 rounded-full transition-all`}
                                disabled={cannotSignUp}
                                title={alreadySignedUp ? 'Al aangemeld' : 'Aanmelden'}
                            >
                                {alreadySignedUp ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <line x1="19" y1="8" x2="19" y2="14" />
                                        <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                )}
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowDetails?.();
                            }}
                            className="p-2 rounded-full bg-(--bg-soft) text-(--theme-purple) hover:scale-105 transition-all"
                            title="Meer info"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
