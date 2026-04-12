'use client';

import React from 'react';
import { Activity, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import { Skeleton } from '@/components/ui/Skeleton';

interface SyncStatsIslandProps {
    isLoading?: boolean;
    status?: any | null;
}

export default function SyncStatsIsland({ isLoading, status }: SyncStatsIslandProps) {
    const adminStats = [
        { label: 'Status', value: status?.status || 'idle', icon: Activity, trend: status?.active ? 'Running' : 'Standby' },
        { label: 'Geslaagd', value: status?.successCount || 0, icon: CheckCircle, trend: 'Leden' },
        { label: 'Fouten', value: status?.errorCount || 0, icon: AlertCircle, trend: 'Issues' },
        { label: 'Nieuw', value: status?.createdCount || 0, icon: UserPlus, trend: 'Created' },
        { label: 'Verlopen', value: status?.movedExpiredCount || 0, icon: Activity, trend: 'Moved' },
    ];

    return (
        <div className={isLoading ? 'skeleton-active' : ''}>
            <AdminStatsBar stats={adminStats} />
        </div>
    );
}
