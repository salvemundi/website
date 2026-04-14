'use client';

import { Activity, RefreshCw, AlertCircle, UserPlus } from 'lucide-react';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import { useSync } from './SyncContext';

export default function SyncStatsIsland() {
    const { isLoading, status } = useSync();

    const issuesCount = (status?.errorCount || 0) + (status?.warningCount || 0) + (status?.missingDataCount || 0);
    const updatedCount = (status?.successCount || 0) + (status?.movedExpiredCount || 0);

    const adminStats = [
        { label: 'Status', value: status?.status || 'Active', icon: Activity, trend: status?.active ? 'Running' : 'Standby' },
        { label: 'Updated', value: updatedCount, icon: RefreshCw, trend: 'Leden' },
        { label: 'Issues', value: issuesCount, icon: AlertCircle, trend: 'Warnings' },
        { label: 'Nieuw', value: status?.createdCount || 0, icon: UserPlus, trend: 'Created' },
    ];

    return (
        <div className={isLoading ? '' : 'animate-in fade-in duration-500'}>
            <AdminStatsBar stats={adminStats} />
        </div>
    );
}
