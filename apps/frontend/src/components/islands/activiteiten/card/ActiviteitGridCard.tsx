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
    isDeadlinePassed?: boolean;
    isFull?: boolean;
    handleSignupClick: (event: React.MouseEvent) => void;
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
    isDeadlinePassed = false,
    isFull = false,
    handleSignupClick,
    onShowDetails
}: ActiviteitGridCardProps) {
    return (
        <div
            onClick={onShowDetails}
            className={`group relative z-0 flex w-full card-interactive flex-col overflow-hidden p-0 ${isPast ? 'opacity-75 grayscale-50' : ''}`}
        >
            <div className="relative z-10 aspect-video w-full overflow-hidden bg-theme-purple/5">
                {image ? (
                    <MediaAsset
                        asset={image}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        objectFit="contain"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <Calendar className="size-12 text-theme-purple/20" />
                    </div>
                )}
                <div className="card-badge-stack">
                    <span className="badge-status bg-theme-purple text-wit-paars shadow-md">
                        {committeeLabel}
                    </span>
                    {onlyMembers && (
                        <span className="badge-status bg-geel text-donker-blauw shadow-md">
                            Leden Alleen
                        </span>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex grow flex-col space-y-3 p-5">
                <h3 className="line-clamp-2 text-xl font-bold text-theme-purple transition-colors">
                    {title}
                </h3>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-theme-purple">
                        <Calendar className="size-4" />
                        <span>{displayDate}</span>
                    </div>
                    {timeRange && (
                        <p className="ml-6 text-xs text-text-muted">
                            {timeRange}
                        </p>
                    )}
                </div>

                {short_description ? (
                    <div className="line-clamp-4 overflow-hidden text-sm text-text-muted">
                        <SafeMarkdown content={short_description} className="prose-sm text-text-muted! prose-headings:my-1 prose-p:my-1" />
                    </div>
                ) : description ? (
                    <p className="line-clamp-3 overflow-hidden text-sm text-text-muted">
                        {description}
                    </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t border-theme-purple/20 pt-4">
                    <div className="flex flex-col">
                        <span className="text-2xs font-bold text-text-muted uppercase">Prijs</span>
                        <span className="text-lg font-bold text-theme-purple">€{safePrice}</span>
                    </div>

                    <div className="flex gap-2">
                        {!isPast && (
                            <button
                                onClick={handleSignupClick}
                                className={`icon-button p-2.5 transition-all
                                    ${cannotSignUp
                                        ? 'bg-theme-purple/10 text-text-muted'
                                        : 'bg-theme-purple text-wit-paars shadow-md hover:scale-105'
                                    }`}
                                title={alreadySignedUp ? 'Al aangemeld' : isDeadlinePassed ? 'Aanmelding gesloten' : isFull ? 'Activiteit vol' : 'Aanmelden'}
                                type="button"
                                aria-label="Aanmelden"
                            >
                                {alreadySignedUp ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <line x1="19" y1="8" x2="19" y2="14" />
                                        <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                )}
                            </button>
                        )}
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onShowDetails?.();
                            }}
                            className="icon-button p-2.5"
                            title="Meer info"
                            type="button"
                            aria-label="Meer info"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
