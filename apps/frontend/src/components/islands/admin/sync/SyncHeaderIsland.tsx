'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { useSync } from './SyncContext';

export default function SyncHeaderIsland() {
    const { fetchStatus, status } = useSync();

    return (
        <AdminToolbar 
            title="Azure Sync"
            subtitle="Synchroniseer met Microsoft Azure AD"
            backHref="/beheer"
            actions={
                <div className="flex gap-2">
                    <button
                        onClick={fetchStatus}
                        className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-semibold uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${status?.active ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            }
        />
    );
}
