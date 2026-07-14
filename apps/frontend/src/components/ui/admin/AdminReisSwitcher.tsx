'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Trip } from '@salvemundi/validations';
import AdminSelect from './AdminSelect';

interface AdminReisSwitcherProps {
    trips: Trip[];
    activeTripId: number;
}

export default function AdminReisSwitcher({ trips, activeTripId }: AdminReisSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleSwitch = (newTripId: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tripId', String(newTripId));
        router.push(`${pathname}?${params.toString()}`);
    };

    const options = trips.map(t => ({
        value: t.id,
        label: t.name || 'Onbekende reis'
    }));

    return (
        <div className="min-w-[180px]">
            <AdminSelect
                value={activeTripId}
                onChange={handleSwitch}
                options={options}
                size="sm"
            />
        </div>
    );
}
