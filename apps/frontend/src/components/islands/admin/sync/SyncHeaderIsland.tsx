'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';

interface SyncHeaderIslandProps {
    isLoading?: boolean;
    onRefresh?: () => void;
    isActive?: boolean;
}

export default function SyncHeaderIsland({ isLoading, onRefresh, isActive }: SyncHeaderIslandProps) {
    return (
        <div className={isLoading ? 'skeleton-active' : ''}>
            <AdminToolbar 
                title="Azure Sync"
                subtitle="Synchroniseer met Microsoft Azure AD"
                backHref="/beheer"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${(isActive || isLoading) ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                }
            />
        </div>
    );
}
