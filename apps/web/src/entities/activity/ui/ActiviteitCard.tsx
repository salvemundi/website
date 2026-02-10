'use client';


import Image from 'next/image';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { Calendar } from 'lucide-react';

interface ActiviteitCardProps {
    id: number | string;
    description: string;
    description_logged_in?: string;
    image?: string;
    date?: string;
    endDate?: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    title: string;
    price?: number;
    isPast?: boolean;
    onSignup?: (data: { title: string; date?: string; description: string; price: number }) => void;
    onShowDetails?: () => void;
    requiresLogin?: boolean;
    isSignedUp?: boolean;
    variant?: 'grid' | 'list';
    committeeName?: string;
    inschrijfDeadline?: string;
    contact?: string;
    onlyMembers?: boolean;
}

const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
    id: _id,
    description,
    description_logged_in,
    image,
    title,
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
    inschrijfDeadline,
    onlyMembers = false,
}) => {
    const { isAuthenticated, user, loginWithMicrosoft } = useAuth();

    const alreadySignedUp = Boolean(isSignedUp);
    const isListVariant = variant === 'list';

    // Check if registration deadline has passed
    const isDeadlinePassed = inschrijfDeadline ? new Date(inschrijfDeadline) < new Date() : false;
    const cannotSignUp = alreadySignedUp || isDeadlinePassed;

    const handleSignupClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (onlyMembers && !user?.is_member) {
            if (!isAuthenticated) {
                const returnTo = window.location.pathname + window.location.search;
                localStorage.setItem('auth_return_to', returnTo);
                loginWithMicrosoft();
            } else {
                // User is logged in but not a member
                alert('Deze activiteit is alleen voor leden.');
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

    // Strip organization suffix from committee name
    const cleanCommitteeName = (name?: string) => {
        if (!name) return 'Algemene Activiteit';
        // Remove both "|| SALVE MUNDI" and " - Salve Mundi" suffixes
        return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || name;
    };

    const committeeLabel = cleanCommitteeName(committeeName);

    const formatDate = (value?: string, endValue?: string) => {
        if (!value) return 'Datum volgt';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const startFormatted = parsed.toLocaleDateString('nl-NL', options);

        if (endValue && endValue !== value) {
            const endParsed = new Date(endValue);
            if (!Number.isNaN(endParsed.getTime())) {
                const endFormatted = endParsed.toLocaleDateString('nl-NL', options);
                return `${startFormatted} t/m ${endFormatted}`;
            }
        }

        return startFormatted;
    };

    const formatTime = (time?: string | null, fallbackDate?: string | undefined) => {
        if (time) {
            const parts = time.split(':');
            if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
            return time;
        }

        // Only fallback to the date's time if the stored `fallbackDate` actually contains a time portion
        if (!fallbackDate) return null;
        const raw = fallbackDate;
        const hasTimeInDate = raw.includes('T') || /\d{2}:\d{2}/.test(raw);
        if (!hasTimeInDate) return null;

        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        return null;
    };
    const start = formatTime(startTime, date);
    const end = formatTime(endTime, date);
    const timeRange = start ? (end ? `${start} - ${end}` : start) : null;

    if (isListVariant) {
        return (
            <div
                onClick={onShowDetails}
                className={`group relative z-0 overflow-visible w-full rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 group-hover:z-10 ${isPast ? 'opacity-60 filter grayscale' : ''}`}
            >
                <span className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-theme-purple/20 transition-transform duration-300 group-hover:scale-110 pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex-1 min-w-[180px]">
                        <p className="text-xs uppercase tracking-wider text-theme-purple/60 font-semibold">
                            {committeeLabel}
                        </p>
                        <h3 className="text-lg font-bold text-theme-purple/80 leading-snug">{title}</h3>
                        {contact && (
                            <p className="text-sm text-theme-muted mt-1">
                                <span className="font-medium text-theme-purple/80">Contact:</span>{' '}
                                <span className="text-theme-muted">{contact}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex flex-row flex-wrap gap-4 text-right text-theme-purple/80 font-semibold">
                        <div className="min-w-[160px] text-right">
                            <p className="text-xs text-theme-purple/60 uppercase tracking-wide">Datum & Tijd</p>
                            <p className="text-base">{formatDate(date, endDate)}{timeRange ? ` — ${timeRange}` : ''}</p>
                            {location && <p className="text-xs text-theme-muted mt-1 truncate max-w-[220px]">{location}</p>}
                        </div>
                        <div className="min-w-[90px]">
                            <p className="text-xs text-theme-purple/60 uppercase tracking-wide">Prijs</p>
                            <p className="text-base">€{safePrice}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 mt-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails?.();
                        }}
                        className="px-4 py-2 text-sm font-semibold rounded-full text-theme-purple hover:bg-gradient-theme hover:text-theme-purple dark:hover:text-theme-white transition"
                    >
                        MEER INFO
                    </button>

                    {!isPast && (
                        <button
                            onClick={handleSignupClick}
                            className={`${cannotSignUp ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gradient-theme text-theme-purple dark:text-theme-white shadow-lg shadow-theme-purple/30 hover:-translate-y-0.5 hover:shadow-xl'} px-4 py-2 text-sm font-semibold rounded-full transition-transform`}
                            disabled={cannotSignUp}
                        >
                            {alreadySignedUp ? 'AL AANGEMELD' : isDeadlinePassed ? 'INSCHRIJVEN GESLOTEN' : 'AANMELDEN'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onShowDetails}
            className={`group relative z-0 overflow-visible w-full rounded-[1.75rem] bg-[var(--bg-card)] dark:border dark:border-white/10 p-5 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 group-hover:z-10 ${isPast ? 'opacity-60 filter grayscale' : ''}`}
        >
            <span className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-theme-purple/10 transition-transform duration-500 group-hover:scale-125 pointer-events-none" />

            {/* Image Section */}
            <div className="relative z-10 h-44 sm:h-48 mb-5 rounded-2xl overflow-hidden shadow-inner">
                <Image
                    src={image || '/img/placeholder.svg'}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE5MiIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/img/placeholder.svg';
                    }}
                />
                {!isPast && (
                    <div className="absolute top-4 right-4 z-20">
                        <span className="bg-theme-purple text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                            {committeeLabel}
                        </span>
                        {onlyMembers && (
                            <span className="ml-2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                                Leden Alleen
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-grow relative z-10 space-y-3">
                <h3 className="text-xl font-bold text-theme-purple/80 leading-snug line-clamp-2">
                    {title}
                </h3>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-theme-purple/80 font-semibold">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(date, endDate)}</span>
                    </div>
                    {timeRange && (
                        <p className="text-sm text-theme-muted ml-6">
                            {timeRange}
                        </p>
                    )}
                </div>

                <p className="text-theme-muted text-sm line-clamp-3 leading-relaxed">
                    {description_logged_in || description}
                </p>

                {/* Footer Section */}
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-theme-purple/50">Prijs</span>
                        <span className="text-lg font-bold text-theme-purple/80">€{safePrice}</span>
                    </div>

                    <div className="flex gap-2">
                        {!isPast && (
                            <button
                                onClick={handleSignupClick}
                                className={`${cannotSignUp ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-gradient-theme text-theme-purple dark:text-theme-white shadow-lg shadow-theme-purple/20 hover:scale-105'} p-2 rounded-full transition-all`}
                                disabled={cannotSignUp}
                                title={alreadySignedUp ? 'Al aangemeld' : 'Aanmelden'}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowDetails?.();
                            }}
                            className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-theme-purple dark:text-theme-white hover:scale-105 transition-all"
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
};

export default ActiviteitCard;
