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
        safeConsoleError('[error.tsx][MembershipError] Error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
            <div className="relative mb-8 pt-10">
                <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto size-40 rounded-full bg-theme-purple/10 blur-3xl" />

                <div className="relative inline-block squircle-lg border border-(--border-color)/20 bg-(--bg-card) p-6 text-theme-purple shadow-2xl">
                    <AlertTriangle className="size-16" />
                </div>
            </div>

            <h1 className="mb-3 text-4xl font-black tracking-tight text-(--text-main)">
                Er is iets misgegaan
            </h1>

            <p className="mx-auto mb-10 max-w-lg leading-relaxed font-medium text-(--text-muted)">
                Onze servers konden je lidmaatschapsgegevens niet ophalen.
                Probeer de pagina te herladen of controleer je internetverbinding.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                    onClick={() => reset()}
                    className="form-button py-3.5"
                    type="button">
                    <RefreshCcw className="size-4" />
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
                <p className="mt-12 font-mono text-[10px] text-(--text-muted) opacity-50">
                    Err-ID: {error.digest}
                </p>
            )}
        </div>
    );
}
