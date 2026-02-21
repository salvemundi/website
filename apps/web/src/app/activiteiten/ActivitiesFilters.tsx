'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, Suspense } from 'react';

function FiltersContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentView = searchParams.get('view') || 'list';
    const showPast = searchParams.get('past') === 'true';

    const setQueryParam = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            router.push(pathname + '?' + params.toString(), { scroll: false });
        },
        [searchParams, pathname, router]
    );

    const togglePast = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (showPast) {
            params.delete('past');
        } else {
            params.set('past', 'true');
        }
        router.push(pathname + '?' + params.toString(), { scroll: false });
    };

    const handleSyncAgenda = async () => {
        const calendarUrl = 'https://api.salvemundi.nl/calendar';
        try {
            const resp = await fetch(calendarUrl, { cache: 'no-store' });
            if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'salve-mundi.ics';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.warn('Calendar sync failed, falling back to webcal/open:', err);
            try {
                const webcalUrl = calendarUrl.replace(/^https?:/, 'webcal:');
                window.location.href = webcalUrl;
            } catch (e) {
                window.open(calendarUrl, '_blank');
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-3xl font-bold text-theme-purple dark:text-theme-white">
                {showPast ? 'Alle Activiteiten' : 'Komende Activiteiten'}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleSyncAgenda}
                    className="px-4 py-2 text-sm font-semibold bg-[var(--bg-card)] dark:bg-surface-dark text-theme-purple dark:text-white rounded-lg hover:bg-theme-purple/5 dark:hover:bg-white/5 transition-colors shadow-sm flex items-center gap-2"
                >
                    📅 Sync Agenda
                </button>

                <button
                    onClick={togglePast}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${showPast
                            ? 'bg-theme-purple/10 dark:bg-white/10 text-theme-purple dark:text-white shadow-sm'
                            : 'bg-[var(--bg-card)] dark:bg-surface-dark text-theme-purple dark:text-white hover:bg-theme-purple/5 dark:hover:bg-white/5'
                        }`}
                >
                    {showPast ? 'Verberg Afgelopen' : 'Toon Afgelopen'}
                </button>
            </div>

            <div className="hidden md:flex rounded-lg bg-[var(--bg-card)] dark:bg-surface-dark overflow-hidden shadow-sm">
                <button
                    onClick={() => setQueryParam('view', 'list')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'list'
                            ? 'bg-theme-purple/10 dark:bg-white/10 text-theme-purple dark:text-white shadow-sm'
                            : 'text-theme-purple dark:text-white hover:bg-theme-purple/5 dark:hover:bg-white/5'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                        Lijst
                    </span>
                </button>
                <button
                    onClick={() => setQueryParam('view', 'grid')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'grid'
                            ? 'bg-theme-purple/10 dark:bg-white/10 text-theme-purple dark:text-white shadow-sm'
                            : 'text-theme-purple dark:text-white hover:bg-theme-purple/5 dark:hover:bg-white/5'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="8" height="8" rx="1" ry="1" /><rect x="13" y="3" width="8" height="8" rx="1" ry="1" /><rect x="3" y="13" width="8" height="8" rx="1" ry="1" /><rect x="13" y="13" width="8" height="8" rx="1" ry="1" />
                        </svg>
                        Kaarten
                    </span>
                </button>
                <button
                    onClick={() => setQueryParam('view', 'calendar')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'calendar'
                            ? 'bg-theme-purple/10 dark:bg-white/10 text-theme-purple dark:text-white shadow-sm'
                            : 'text-theme-purple dark:text-white hover:bg-theme-purple/5 dark:hover:bg-white/5'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Kalender
                    </span>
                </button>
            </div>
        </div>
    );
}

export default function ActivitiesFilters() {
    return (
        <Suspense fallback={<div className="h-10 animate-pulse bg-slate-200 dark:bg-white/10 rounded-lg w-full max-w-sm mb-8"></div>}>
            <FiltersContent />
        </Suspense>
    );
}
