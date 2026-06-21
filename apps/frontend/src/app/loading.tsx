'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/layout/LoadingSpinner';

/**
 * Root Loading (SSOT) - Salve Mundi V7 Industrial Architecture.
 * * Zone 1: 0ms - 200ms  -> Pure Silence (Feels instant)
 * Zone 2: 200ms - 3s   -> Premium Spinner
 * Zone 3: > 3s         -> Spinner + ICT Warning
 */
export default function GlobalLoading() {
    const [status, setStatus] = useState<'instant' | 'loading' | 'slow'>('instant');

    useEffect(() => {
        const loadingTimer = setTimeout(() => setStatus('loading'), 200);
        const slowTimer = setTimeout(() => setStatus('slow'), 3000);

        return () => {
            clearTimeout(loadingTimer);
            clearTimeout(slowTimer);
        };
    }, []);

    // =========================================================================
    // ZONE 1: Pure Silence (0ms - 200ms)
    // Voorkomt hinderlijk flikkeren van loaders bij razendsnelle server responses.
    // =========================================================================
    if (status === 'instant') return null;

    return (
        <div className="relative flex flex-1 w-full flex-col items-center justify-center gap-6">
            <style>{`
                @keyframes deterministic-fade-in {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .loader-reveal {
                    animation: deterministic-fade-in 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
            `}</style>

            <div className="loader-reveal flex flex-col items-center justify-center gap-6">

                {/* =========================================================================
                    ZONE 2: Premium Spinner (200ms - 3s)
                    Zodra de status overgaat naar 'loading', wordt de hoogwaardige geanimeerde
                    spinner ingeladen voor een soepele indicatie van activiteit.
                    ========================================================================= */}
                <div className="relative">
                    <LoadingSpinner size={48} />
                    <div className="absolute inset-0 blur-3xl bg-purple-500/10 -z-10 rounded-full scale-150" />
                </div>

                <div className="text-center space-y-3 px-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-(--text-muted) tracking-[0.4em] uppercase opacity-40">
                            Salve Mundi V7
                        </p>
                        <p className="text-[9px] font-bold text-purple-500/30 uppercase tracking-[0.2em]">
                            Digital Architecture
                        </p>
                    </div>

                    {/* =========================================================================
                        ZONE 3: Spinner + ICT Warning (> 3s)
                        Wanneer de database of API-fetch vertraging oploopt, wordt er dynamisch
                        een waarschuwing bijgeplaatst om de gebruiker te informeren.
                        ========================================================================= */}
                    {status === 'slow' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                            <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest max-w-xs leading-relaxed">
                                Dit duurt langer dan verwacht... <br />
                                Controleer je internetverbinding of neem contact op met de ICT-commissie.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}