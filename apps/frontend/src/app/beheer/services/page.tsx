import React from 'react';
import SystemManagementIsland from '@/components/islands/admin/SystemManagementIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getServicesStatusAction } from '@/server/actions/infrastructure/services-status.actions';
import { getSystemAutomationSettings } from '@/server/actions/admin/admin-automation.actions';

export const metadata = {
    title: 'Systeem Beheer | SV Salve Mundi' 
};

export default async function ServicesStatusPage() {
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
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 rounded-2xl border border-border-color/50 bg-bg-soft px-4 py-2 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Systemen</span>
                        <span className="text-sm leading-none font-bold text-text-main">{initialStatuses.length}</span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Automatisering</span>
                        <span className="text-sm leading-none font-bold text-text-main">{automationCount}</span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Mail Flows</span>
                        <span className="text-sm leading-none font-bold text-text-main">{mailCount}</span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Gezondheid</span>
                        <span className={`text-sm leading-none font-bold ${issuesCount === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
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
