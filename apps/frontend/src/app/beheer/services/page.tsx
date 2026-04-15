import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import ServicesStatusIsland from '@/components/islands/admin/ServicesStatusIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getServicesStatusAction } from '@/server/actions/services-status.actions';

export const metadata = {
    title: 'System Status | SV Salve Mundi',
};

/**
 * ServicesStatusPage: Zero-Skeleton Nuclear SSR.
 * All initial data is fetched on the server to prevent layout shift and skeletons.
 */
export default async function ServicesStatusPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session || !session.user) {
        redirect('/beheer');
    }
    
    const user = session.user as any;
    const memberships = user.committees || [];
    
    const hasAccess = memberships.some((c: any) => 
        c.id === COMMITTEES.ICT || c.id === COMMITTEES.BESTUUR
    );

    if (!hasAccess) {
        redirect('/beheer');
    }

    // NUCLEAR SSR: Fetch initial status at the top level
    const initialStatuses = await getServicesStatusAction().catch(() => []);

    return (
        <AdminPageShell 
            title="System Status"
            subtitle="Real-time status van alle Salve Mundi backend services"
            backHref="/beheer"
        >
            <ServicesStatusIsland initialStatuses={initialStatuses} />
        </AdminPageShell>
    );
}

