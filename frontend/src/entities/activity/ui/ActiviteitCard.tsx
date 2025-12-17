'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';

interface ActiviteitCardProps {
    description: string;
    image?: string;
    date?: string;
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
}

const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
    description,
    image,
    title,
    date,
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
}) => {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const alreadySignedUp = Boolean(isSignedUp);
    const isListVariant = variant === 'list';

    const handleSignupClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (alreadySignedUp) {
            return;
        }

        if (requiresLogin && !isAuthenticated) {
            router.push('/login');
            return;
        }

        onSignup?.({ title, date, description, price: price || 0 });
    };

    const safePrice = (Number(price) || 0).toFixed(2);
    const committeeLabel = committeeName || 'Algemene Activiteit';

    const formatDate = (value?: string) => {
        if (!value) return 'Datum volgt';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
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
                className={`w-full rounded-2xl bg-[var(--bg-card)] p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${isPast ? 'opacity-60 filter grayscale' : ''}`}
            >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex-1 min-w-[180px]">
                        <p className="text-xs uppercase tracking-wider text-theme-purple/60 font-semibold">
                            {committeeLabel}
                        </p>
                        <h3 className="text-lg font-bold text-theme-purple leading-snug">{title}</h3>
                    </div>

                    <div className="flex flex-row flex-wrap gap-4 text-right text-theme-purple font-semibold">
                        <div className="min-w-[160px] text-right">
                            <p className="text-xs text-theme-purple/60 uppercase tracking-wide">Datum & Tijd</p>
                            <p className="text-base">{formatDate(date)}{timeRange ? ` — ${timeRange}` : ''}</p>
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
                        className="px-4 py-2 text-sm font-semibold rounded-full text-theme-purple hover:bg-gradient-theme hover:text-theme-white transition"
                    >
                        MEER INFO
                    </button>

                    {!isPast && (
                        <button
                            onClick={handleSignupClick}
                            className={`${alreadySignedUp ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gradient-theme text-theme-white shadow-lg shadow-theme-purple/30 hover:-translate-y-0.5 hover:shadow-xl'} px-4 py-2 text-sm font-semibold rounded-full transition-transform`}
                            disabled={alreadySignedUp}
                        >
                            {alreadySignedUp ? 'AL AANGEMELD' : 'AANMELDEN'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onShowDetails}
            className={`bg-gradient-theme p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col w-full overflow-hidden cursor-pointer transition-all hover:scale-[1.02] relative h-full ${isPast ? 'opacity-70 filter grayscale' : ''}`}
        >
            {/* Greyed out overlay for past activities (subtle) */}
            {isPast && (
                <div className="absolute inset-0 bg-white/30 rounded-2xl z-0 pointer-events-none" />
            )}

            {/* Image with rounded corners at the top - always show */}
            <div className="relative z-10">
                <img
                    src={image || '/img/placeholder.svg'}
                    alt={title}
                    className="w-full h-40 sm:h-44 md:h-48 object-cover rounded-xl mb-4"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/img/placeholder.svg';
                    }}
                />
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-grow text-theme-white relative z-10">
                {/* Header - Title, Date, and Price */}
                <div className="flex flex-row justify-between items-start mb-2 gap-3 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold text-theme-purple-lighter leading-tight pr-2 sm:pr-4 break-words w-full sm:flex-1">
                        {title}
                    </h1>
                    <div className="flex flex-col items-end whitespace-nowrap text-right ml-auto">
                        {date && (
                            <>
                                <p className="text-xs sm:text-sm font-semibold text-theme-white">{formatDate(date)}</p>
                                {timeRange && <p className="text-sm text-theme-white/90">{timeRange}</p>}
                            </>
                        )}
                        {location && <p className="text-xs text-theme-white/80 mt-1">{location}</p>}
                        <span className="text-lg font-bold text-theme-white">€{safePrice}</span>
                    </div>
                </div>

                {/* Description - truncated to 150 characters */}
                <p className="text-theme-white/90 text-sm sm:text-base mb-4 sm:mb-6 flex-grow break-words overflow-hidden">
                    {description && description.length > 150
                        ? `${description.substring(0, 150)}...`
                        : description}
                </p>

                {/* Footer - Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-auto w-full">
                    {/* Details Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails?.();
                        }}
                        className="bg-theme-white text-theme-purple font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-opacity-90 w-full sm:w-auto"
                    >
                        MEER INFO
                    </button>

                    {/* Sign-up Button */}
                    {!isPast && (
                        <button
                            onClick={handleSignupClick}
                            className={`${alreadySignedUp ? 'bg-gray-400 text-theme-white cursor-not-allowed' : 'bg-theme-purple-lighter text-theme-purple-darker shadow-lg shadow-theme-purple/30 hover:-translate-y-0.5 hover:shadow-xl'} font-semibold px-5 py-3 rounded-full w-full sm:w-auto flex items-center justify-center gap-2 transition-transform`}
                            disabled={alreadySignedUp}
                        >
                            {requiresLogin && !isAuthenticated && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                            {alreadySignedUp ? 'AL AANGEMELD' : 'AANMELDEN'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActiviteitCard;
