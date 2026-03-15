import React from 'react';

/**
 * Skeleton voor een Safe Haven kaart om layout shift te voorkomen.
 * Matcht de opbouw van SafeHavenCard.tsx exact.
 */
export default function SafeHavenSkeleton() {
    return (
        <div className="flex flex-col rounded-2xl bg-[var(--bg-soft)]/20 border border-[var(--border-color)]/20 p-5 sm:p-6 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 bg-[var(--bg-soft)] rounded-2xl shrink-0 opacity-40"></div>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-[var(--bg-soft)] rounded"></div>
                    <div className="h-4 w-1/2 bg-[var(--bg-soft)] rounded opacity-50"></div>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <div className="h-4 w-full bg-[var(--bg-soft)] rounded opacity-40"></div>
                <div className="h-4 w-5/6 bg-[var(--bg-soft)] rounded opacity-40"></div>
                <div className="h-4 w-2/3 bg-[var(--bg-soft)] rounded opacity-40"></div>
            </div>

            <div className="mt-5 space-y-2">
                <div className="h-10 w-full bg-[var(--bg-soft)] border border-[var(--border-color)]/20 rounded-xl"></div>
                <div className="h-10 w-full bg-[var(--bg-soft)] border border-[var(--border-color)]/20 rounded-xl"></div>
            </div>
        </div>
    );
}
