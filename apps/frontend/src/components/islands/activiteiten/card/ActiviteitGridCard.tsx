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
            className={`group relative z-0 w-full cursor-pointer overflow-hidden rounded-[1.75rem] bg-(--bg-card) p-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border dark:border-white/10 ${isPast ? 'opacity-75 grayscale-50' : ''}`}
        >
            <div className="relative z-10 mb-0 aspect-video w-full overflow-hidden">
                {image ? (
                    <MediaAsset
                        asset={image}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        objectFit="contain"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-transparent">
                        <Calendar className="size-12 text-(--theme-purple)/20" />
                    </div>
                )}
                <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                    <span className="rounded-full bg-(--theme-purple) px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg backdrop-blur-md">
                        {committeeLabel}
                    </span>
                    {onlyMembers && (
                        <span className="rounded-full bg-(--theme-warning) px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg backdrop-blur-md">
                            Leden Alleen
                        </span>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex grow flex-col space-y-3 p-5">
                <h3 className="line-clamp-2 text-xl leading-tight font-bold wrap-break-word text-(--theme-purple)/90 transition-colors group-hover:text-(--theme-purple)">
                    {title}
                </h3>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-(--theme-purple)/80">
                        <Calendar className="size-4" />
                        <span>{displayDate}</span>
                    </div>
                    {timeRange && (
                        <p className="ml-6 text-sm font-medium text-(--text-muted)">
                            {timeRange}
                        </p>
                    )}
                </div>

                {short_description ? (
                    <div className="line-clamp-5 overflow-hidden text-sm leading-relaxed wrap-break-word text-(--text-muted)">
                        <SafeMarkdown content={short_description} className="prose-sm text-(--text-muted)! prose-headings:my-1 prose-p:my-1" />
                    </div>
                ) : description ? (
                    <p className="line-clamp-3 overflow-hidden text-sm leading-relaxed wrap-break-word text-(--text-muted)">
                        {description}
                    </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t border-(--border-color) pt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-(--theme-purple)/50 uppercase">Prijs</span>
                        <span className="text-lg font-bold text-(--theme-purple)/80">€{safePrice}</span>
                    </div>

                    <div className="flex gap-2">
                        {!isPast && (
                            <button
                                onClick={handleSignupClick}
                                className={`icon-button rounded-full p-2 transition-all duration-200
                                    ${cannotSignUp
                                        ? 'bg-(--bg-soft) text-(--text-muted)'
                                        : 'bg-(--theme-purple) text-white shadow-(--theme-purple)/20 shadow-lg hover:scale-105'
                                    }`}
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
                            className="icon-button rounded-full bg-(--bg-soft) p-2 text-(--theme-purple)"
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
