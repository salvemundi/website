'use client';

import { useEffect } from 'react';
import { useSync } from './SyncContext';
import SyncStatsIsland from './SyncStatsIsland';
import SyncControlIsland from './SyncControlIsland';
import SyncMonitorIsland from './SyncMonitorIsland';

interface SyncHydratorProps {
    initialStatus: any | null;
}

/**
 * A client component that bridges the server-fetched status to the shared SyncContext.
 * Once this hydrator renders (inside Suspense), it "wakes up" all islands with real data.
 */
export default function SyncHydrator({ initialStatus }: SyncHydratorProps) {
    const { fetchStatus } = useSync();

    // In a real PPR scenario, we might use initialStatus to hydrate the context state.
    // However, since the islands are already rendered as shells, we just render them
    // here to replace the fallback, and the context will manage the data flow.
    
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
            <div className="space-y-8">
                <SyncStatsIsland />
                <SyncControlIsland />
                <SyncMonitorIsland />
            </div>
        </div>
    );
}
