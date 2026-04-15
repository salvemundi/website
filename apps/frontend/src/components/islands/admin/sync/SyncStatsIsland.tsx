'use client';

import { Activity, RefreshCw, AlertCircle, UserPlus } from 'lucide-react';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import { useSync } from './SyncContext';

export default function SyncStatsIsland() {
    const { status } = useSync();

    const issuesCount = (status?.errorCount || 0) + (status?.warningCount || 0) + (status?.missingDataCount || 0);
    // Nuclear SSR: Success count might include creations, so we subtract createdCount for a clear 'Updated' label
    const updatedCount = Math.max(0, (status?.successCount || 0) - (status?.createdCount || 0)) + (status?.movedExpiredCount || 0);

    const adminStats = [
        { label: 'Status', value: status?.status || 'Idle', icon: Activity, trend: status?.active ? 'Running' : 'Standby' },
        { label: 'Opgeslagen', value: updatedCount, icon: RefreshCw, trend: 'Leden' },
        { label: 'Issues', value: issuesCount, icon: AlertCircle, trend: 'Zorg' },
        { label: 'Nieuw', value: status?.createdCount || 0, icon: UserPlus, trend: 'Azure' },
    ];

    return (
        <div className="animate-in fade-in duration-700">
            <AdminStatsBar stats={adminStats} />
        </div>
    );
}
