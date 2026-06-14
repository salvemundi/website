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
        <div className="min-w-[160px]">
            <select
                value={activeTripId}
                onChange={handleSwitch}
                className="beheer-select w-full pr-8 py-1.5 text-xs font-semibold bg-bg-card border border-border-color text-text-main rounded-xl focus:ring-2 focus:ring-theme-purple/20 outline-none transition-all cursor-pointer hover:border-theme-purple/50"
            >
                {trips.map(t => (
                    <option key={t.id} value={t.id}>
                        {t.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
