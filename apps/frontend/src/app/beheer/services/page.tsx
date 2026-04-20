import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import ServicesStatusIsland from '@/components/islands/admin/ServicesStatusIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getServicesStatusAction } from '@/server/actions/services-status.actions';
import { checkAdminAccess } from '@/server/actions/admin.actions';

export const metadata = {
    title: 'System Status | SV Salve Mundi',
};

/**
 * ServicesStatusPage: Zero-Skeleton Nuclear SSR.
 * All initial data is fetched on the server to prevent layout shift and skeletons.
 */
export default async function ServicesStatusPage() {
    const access = await checkAdminAccess();
    if (!access || !access.isAuthorized || !access.isIct) {
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

