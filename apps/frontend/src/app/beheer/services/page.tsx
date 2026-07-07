import React from 'react';
import { redirect } from 'next/navigation';
import SystemManagementIsland from '@/components/islands/admin/SystemManagementIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getServicesStatusAction } from '@/server/actions/infrastructure/services-status.actions';
import { getSystemAutomationSettings } from '@/server/actions/admin/admin-automation.actions';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';

export const metadata = {
    title: 'Systeem Beheer | SV Salve Mundi' };
export default async function ServicesStatusPage() {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');
    const permissions = getPermissions(session.user.committees);
    
    if (!permissions.includes('services') && !permissions.includes('ict')) {
        return <AdminUnauthorized title="Systeem Status" backHref="/beheer" />;
    }

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
                <div className="flex items-center gap-4 bg-bg-soft px-4 py-2 rounded-2xl border border-border-color/50 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Systemen</span>
                        <span className="text-sm font-bold text-text-main leading-none">{initialStatuses.length}</span>
                    </div>
                    <div className="w-px h-6 bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Automatisering</span>
                        <span className="text-sm font-bold text-text-main leading-none">{automationCount}</span>
                    </div>
                    <div className="w-px h-6 bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Mail Flows</span>
                        <span className="text-sm font-bold text-text-main leading-none">{mailCount}</span>
                    </div>
                    <div className="w-px h-6 bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Gezondheid</span>
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
