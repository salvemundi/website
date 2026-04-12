'use client';

import React from 'react';
import { Activity, RefreshCw, AlertCircle, UserPlus } from 'lucide-react';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import { Skeleton } from '@/components/ui/Skeleton';

interface SyncStatsIslandProps {
    isLoading?: boolean;
    status?: any | null;
}

export default function SyncStatsIsland({ isLoading, status }: SyncStatsIslandProps) {
    const issuesCount = (status?.errorCount || 0) + (status?.warningCount || 0) + (status?.missingDataCount || 0);
    const updatedCount = (status?.successCount || 0) + (status?.movedExpiredCount || 0);

    const adminStats = [
        { label: 'Status', value: status?.status || 'idle', icon: Activity, trend: status?.active ? 'Running' : 'Standby' },
        { label: 'Updated', value: updatedCount, icon: RefreshCw, trend: 'Leden' },
        { label: 'Issues', value: issuesCount, icon: AlertCircle, trend: 'Warnings' },
        { label: 'Nieuw', value: status?.createdCount || 0, icon: UserPlus, trend: 'Created' },
    ];

    return (
        <div className={isLoading ? 'skeleton-active' : ''}>
            <AdminStatsBar stats={adminStats} />
        </div>
    );
}
