import React from 'react';
import SystemManagementIsland from '@/components/islands/beheer/SystemManagementIsland';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import { getServicesStatusAction } from '@/server/actions/infrastructure/services-status.actions';
import { getSystemAutomationSettings } from '@/server/actions/beheer/services/beheer-automation.actions';

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
        <BeheerPageShell 
            title="Systeem & Automatisering"
            backHref="/beheer"
            actions={
                <div className="beheer-stat-strip">
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Systemen</span>
                        <span className="text-sm leading-none font-bold text-text-main">{initialStatuses.length}</span>
                    </div>
                    <div className="v-divider-sm" />
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Automatisering</span>
                        <span className="text-sm leading-none font-bold text-text-main">{automationCount}</span>
                    </div>
                    <div className="v-divider-sm" />
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Mail Flows</span>
                        <span className="text-sm leading-none font-bold text-text-main">{mailCount}</span>
                    </div>
                    <div className="v-divider-sm" />
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Gezondheid</span>
                        <span className={`text-sm leading-none font-bold ${issuesCount === 0 ? 'text-beheer-active' : 'text-geel'}`}>
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
        </BeheerPageShell>
    );
}
