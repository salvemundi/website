'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select } from '@mantine/core';
import type { Trip } from '@salvemundi/validations';

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
        value: String(t.id),
        label: t.name || 'Onbekende reis'
    }));

    return (
        <Select
            value={String(activeTripId)}
            onChange={(val) => {
                if (val) handleSwitch(Number(val));
            }}
            data={options}
            size="sm"
            allowDeselect={false}
            aria-label="Selecteer reis"
            w={{ base: '100%', sm: 'auto' }}
            miw={{ sm: 180 }}
        />
    );
}
