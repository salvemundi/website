'use client';

import React from 'react';
import Image from 'next/image';
import BannerAsset from '@/components/ui/media/BannerAsset';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Calendar } from 'lucide-react';
import { useAuth, useAuthActions } from '@/features/auth/providers/auth-provider';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { formatDate as coreFormatDate } from '@/shared/lib/utils/date';

interface ActiviteitCardProps {
    id?: number | string;
    description?: string;
    description_logged_in?: string;
    image?: any;
    date?: string;
    endDate?: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    title?: string;
    price?: number;
    isPast?: boolean;
    onSignup?: (data: { title: string; date?: string; description: string; price: number }) => void;
    onShowDetails?: () => void;
    requiresLogin?: boolean;
    isSignedUp?: boolean;
    variant?: 'grid' | 'list';
    committeeName?: string;
    registrationDeadline?: string;
    contact?: string;
    onlyMembers?: boolean;
}
const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
    description = '',
    image,
    title = 'Activiteit',
    date,
    endDate,
    startTime,
    endTime,
    location,
    price,
    isPast = false,
    onSignup,
    onShowDetails,
    requiresLogin = false,
    isSignedUp = false,
    variant = 'grid',
    committeeName,
    contact,
    registrationDeadline,
    onlyMembers = false,
}) => {
    const { toast, showToast, hideToast } = useAdminToast();
    const { isAuthenticated, user } = useAuth();
    const { login: loginWithMicrosoft } = useAuthActions();

    const alreadySignedUp = Boolean(isSignedUp);
    const isListVariant = variant === 'list';
    const isDeadlinePassed = registrationDeadline ? new Date(registrationDeadline) < new Date() : false;
    const cannotSignUp = alreadySignedUp || isDeadlinePassed;

    const handleSignupClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (onlyMembers && (user as any)?.membership_status !== 'active') {
            if (!isAuthenticated) {
                const returnTo = window.location.pathname + window.location.search;
                localStorage.setItem('auth_return_to', returnTo);
                loginWithMicrosoft();
            } else {
                showToast('Deze activiteit is alleen voor leden.', 'error');
            }
            return;
        }

        if (requiresLogin && !isAuthenticated) {
            const returnTo = window.location.pathname + window.location.search;
            localStorage.setItem('auth_return_to', returnTo);
            loginWithMicrosoft();
            return;
        }

        onSignup?.({ title, date, description, price: price || 0 });
    };

    const safePrice = (Number(price) || 0).toFixed(2);

    const cleanCommitteeName = (name?: string) => {
        if (!name) return 'Algemene Activiteit';
        return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || name;
    };

    const committeeLabel = cleanCommitteeName(committeeName);

    const displayDate = variant === 'list' 
        ? coreFormatDate(date, 'EEEE d MMMM')
        : coreFormatDate(date, 'd MMMM yyyy');

    const start = startTime ? startTime.split(':').slice(0, 2).join(':') : null;
    const end = endTime ? endTime.split(':').slice(0, 2).join(':') : null;
    const timeRange = start ? (end ? `${start} - ${end}` : start) : null;

    if (isListVariant) {
        return (
            <div
                onClick={onShowDetails}
                className={`group relative z-0 overflow-hidden w-full rounded-2xl bg-[var(--bg-card)] dark:border dark:border-[var(--color-white)]/10 p-5 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 ${isPast ? 'opacity-60 filter grayscale' : ''}`}
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-widest text-[var(--theme-purple)] font-black bg-[var(--theme-purple)]/10 px-2 py-0.5 rounded-md">
                                {committeeLabel}
                            </span>
                            {onlyMembers && (
                                <span className="text-[10px] uppercase tracking-widest text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded-md">
                                    Leden
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-[var(--theme-purple)]/90 leading-tight group-hover:text-[var(--theme-purple)] transition-colors line-clamp-2 break-words" title={title}>
                            {title}
                        </h3>
                        {description && (
                            <p className="hidden md:block text-[var(--text-muted)] text-sm line-clamp-2 mt-2 leading-relaxed pr-4">
                                {description}
                            </p>
                        )}
                        {contact && (
                            <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                                <span className="font-bold opacity-70">Contact:</span>
                                <span>{contact}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center lg:items-center gap-6 md:gap-10">
                        <div className="text-left sm:text-right min-w-[160px] flex-shrink-0">
                            <p className="text-[10px] font-black text-[var(--theme-purple)]/40 uppercase tracking-widest mb-1 leading-none">Datum & Tijd</p>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-[var(--theme-purple)]/80 whitespace-nowrap">
                                    {displayDate}
                                </p>
                                <p className="text-xs font-medium text-[var(--text-muted)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                                    {timeRange || 'Tijd volgt'} • {location || 'Locatie volgt'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-soft)] px-4 py-2 rounded-xl border border-[var(--border-color)] text-center min-w-[80px]">
                            <p className="text-[10px] font-black text-[var(--theme-purple)]/40 uppercase tracking-widest mb-0.5">Prijs</p>
                            <p className="text-lg font-black text-[var(--theme-purple)]">€{safePrice}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]/5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails?.();
                        }}
                        className="px-4 py-2 text-sm font-semibold rounded-full text-[var(--theme-purple)] hover:bg-[var(--theme-purple)] hover:text-[var(--color-white)] transition"
                    >
                        MEER INFO
                    </button>

                    {!isPast && (
                        <button
                            onClick={handleSignupClick}
                            className={`${cannotSignUp ? 'bg-[var(--color-purple-100)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--theme-purple)] text-[var(--color-white)] shadow-lg shadow-[var(--theme-purple)]/30 hover:-translate-y-0.5 hover:shadow-xl'} px-4 py-2 text-sm font-semibold rounded-full transition-transform`}
                            disabled={cannotSignUp}
                        >
                            {alreadySignedUp ? 'AL AANGEMELD' : isDeadlinePassed ? 'AANMELDING GESLOTEN' : 'AANMELDEN'}
                        </button>
                    )}
                </div>
                <AdminToast toast={toast} onClose={hideToast} />
            </div>
        );
    }

    // Grid Variant
    return (
        <div
            onClick={onShowDetails}
            className={`group relative z-0 overflow-hidden w-full rounded-[1.75rem] bg-[var(--bg-card)] dark:border dark:border-[var(--color-white)]/10 p-5 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 ${isPast ? 'opacity-60 filter grayscale' : ''}`}
        >
            <div className="relative z-10 aspect-video mb-5 rounded-2xl overflow-hidden shadow-inner bg-[var(--bg-soft)]">
                {image ? (
                    <BannerAsset
                        asset={image}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-contain transition-all duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--theme-purple)]/5">
                        <Calendar className="h-12 w-12 text-[var(--theme-purple)]/20" />
                    </div>
                )}
                {!isPast && (
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                        <span className="bg-[var(--theme-purple)] text-[var(--color-white)] text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                            {committeeLabel}
                        </span>
                        {onlyMembers && (
                            <span className="bg-[var(--theme-warning)] text-[var(--color-white)] text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                                Leden Alleen
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col flex-grow relative z-10 space-y-3">
                <h3 className="text-xl font-bold text-[var(--theme-purple)]/80 leading-snug line-clamp-2 break-words">
                    {title}
                </h3>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--theme-purple)]/80 font-bold">
                        <Calendar className="h-4 w-4" />
                        <span>{displayDate}</span>
                    </div>
                    {timeRange && (
                        <p className="text-sm text-[var(--text-muted)] ml-6 font-medium">
                            {timeRange}
                        </p>
                    )}
                </div>

                <p className="text-[var(--text-muted)] text-sm line-clamp-3 leading-relaxed">
                    {description}
                </p>

                <div className="flex items-center justify-between pt-4 mt-auto border-t border-[var(--border-color)]">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-purple)]/50">Prijs</span>
                        <span className="text-lg font-bold text-[var(--theme-purple)]/80">€{safePrice}</span>
                    </div>

                    <div className="flex gap-2">
                        {!isPast && (
                            <button
                                onClick={handleSignupClick}
                                className={`${cannotSignUp ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)]/40 cursor-not-allowed' : 'bg-[var(--theme-purple)] text-[var(--color-white)] shadow-lg shadow-[var(--theme-purple)]/20 hover:scale-105'} p-2 rounded-full transition-all`}
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
                            className="p-2 rounded-full bg-[var(--bg-soft)] text-[var(--theme-purple)] hover:scale-105 transition-all"
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
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
};

export default ActiviteitCard;
