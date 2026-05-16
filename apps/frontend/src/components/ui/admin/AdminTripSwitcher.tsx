'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Trip } from '@salvemundi/validations';

interface AdminTripSwitcherProps {
    trips: Trip[];
    activeTripId: number;
}

export default function AdminTripSwitcher({ trips, activeTripId }: AdminTripSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTripId = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set('tripId', newTripId);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="relative group min-w-[160px]">
            <select
                value={activeTripId}
                onChange={handleSwitch}
                className="beheer-select w-full pr-8 py-1.5 text-xs font-semibold bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl focus:ring-2 focus:ring-[var(--beheer-accent)]/20 outline-none transition-all cursor-pointer hover:border-[var(--beheer-accent)]/50"
            >
                {trips.map(t => (
                    <option key={t.id} value={t.id}>
                        {t.name}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--beheer-text-muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                </svg>
            </div>
        </div>
    );
}
