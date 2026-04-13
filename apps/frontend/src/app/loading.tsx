'use client';

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/ui/layout/LoadingSpinner';

/**
 * Root Loading (SSOT) - Salve Mundi V7 Industrial Architecture.
 * 
 * Zone 1: 0ms - 200ms  -> Pure Silence (Feels instant)
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

    // Zone 1: Zero-Wait Reveal
    if (status === 'instant') return null;

    return (
        <div className="fixed inset-0 z-[9999] flex min-h-[100dvh] w-screen flex-col items-center justify-center gap-6 bg-[var(--bg-main)]">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes deterministic-fade-in {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .loader-reveal {
                    animation: deterministic-fade-in 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
            `}} />
            
            <div className="loader-reveal flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <LoadingSpinner size={48} />
                    <div className="absolute inset-0 blur-3xl bg-[var(--color-purple-500)]/10 -z-10 rounded-full scale-150" />
                </div>
                
                <div className="text-center space-y-3 px-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[var(--text-muted)] tracking-[0.4em] uppercase opacity-40">
                            Salve Mundi V7
                        </p>
                        <p className="text-[9px] font-bold text-[var(--color-purple-500)]/30 uppercase tracking-[0.2em]">
                            Digital Architecture
                        </p>
                    </div>

                    {status === 'slow' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest animate-pulse max-w-xs leading-relaxed">
                                Dit duurt langer dan verwacht... <br/>
                                Controleer je internetverbinding of neem contact op met de ICT-commissie.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
