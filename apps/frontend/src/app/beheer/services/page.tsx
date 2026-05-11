import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import SystemManagementIsland from '@/components/islands/admin/SystemManagementIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getServicesStatusAction } from '@/server/actions/services-status.actions';
import { getSystemAutomationSettings } from '@/server/actions/admin-automation.actions';
import { checkAdminAccess } from '@/server/actions/admin-utils.actions';
import { cn } from '@/lib/utils/cn';

export const metadata = {
    title: 'Systeem Beheer | SV Salve Mundi' };

/**
 * SystemStatusPage: Nuclear SSR for both service health and automation toggles.
 */
export default async function ServicesStatusPage() {
    const access = await checkAdminAccess();
    if (!access || !access.isAuthorized || !access.isIct) {
        redirect('/beheer');
    }

    // NUCLEAR SSR: Parallel fetch for status and settings
    const [initialStatuses, automationRes] = await Promise.all([
        getServicesStatusAction(),
        getSystemAutomationSettings()
    ]);

    const initialAutomationSettings = automationRes.success ? automationRes.settings || [] : [];
    
    const issuesCount = initialStatuses.filter(s => s.status !== 'online').length;
    const automationCount = initialAutomationSettings.filter(s => s.isActive).length;
    const mailCount = initialAutomationSettings.filter(s => s.id.startsWith('mail') && s.isActive).length;

    return (
        <AdminPageShell 
            title="Systeem & Automatisering"
            subtitle="Beheer backend services en automatische processen"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Systemen</span>
                        <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{initialStatuses.length}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Automatisering</span>
                        <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{automationCount}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Mail Flows</span>
                        <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{mailCount}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Gezondheid</span>
                        <span className={`text-sm font-bold leading-none ${issuesCount === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {issuesCount === 0 ? '100%' : 'Check'}
                        </span>
                    </div>
                </div>
            }
        >
            <SystemManagementIsland 
                initialStatuses={initialStatuses} 
                initialAutomationSettings={initialAutomationSettings}
            />
        </AdminPageShell>
    );
}
