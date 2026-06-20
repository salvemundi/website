'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { safeConsoleError } from '@/server/utils/logger';
import BackButton from '@/components/ui/navigation/BackButton';

export default function MembershipError({
    error,
    reset }: {
        error: Error & { digest?: string };
        reset: () => void;
    }) {
    useEffect(() => {
        safeConsoleError('[Membership][MembershipError] Error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center py-20">
            <div className="relative mb-8 pt-10">
                <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-[var(--color-purple-500)]/10 rounded-full pointer-events-none" />

                <div className="relative squircle-lg bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)]/20 text-[var(--color-purple-500)] inline-block">
                    <AlertTriangle className="h-16 w-16" />
                </div>
            </div>

            <h1 className="text-4xl font-black text-[var(--text-main)] mb-3 tracking-tight">
                Er is iets misgegaan
            </h1>

            <p className="text-[var(--text-muted)] max-w-lg mx-auto mb-10 font-medium leading-relaxed">
                Onze servers konden je lidmaatschapsgegevens niet ophalen.
                Probeer de pagina te herladen of controleer je internetverbinding.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button
                    onClick={() => reset()}
                    className="flex items-center gap-2 squircle bg-[var(--color-purple-500)] text-white px-8 py-3.5 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all text-sm"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Opnieuw Proberen
                </button>

                <BackButton
                    href="/"
                    text="Terug naar Home"
                    icon={Home}
                    className="squircle px-8 py-3.5"
                />
            </div>

            {error.digest && (
                <p className="mt-12 text-[10px] font-mono text-[var(--text-muted)] opacity-50">
                    Err-ID: {error.digest}
                </p>
            )}
        </div>
    );
}
